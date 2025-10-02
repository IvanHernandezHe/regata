using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Regata.Domain.Carts;
using Regata.Application.Interface;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CartController : ControllerBase
{
    private readonly UserManager<IdentityUser<Guid>> _users;
    private readonly IAuditLogger _audit;
    private readonly ICartService _svc;
    private const string CartCookie = "cart_id";

    public CartController(UserManager<IdentityUser<Guid>> users, IAuditLogger audit, ICartService svc)
    { _users = users; _audit = audit; _svc = svc; }

    private Guid EnsureCookie(Guid id)
    {
        var isLoopback = string.Equals(Request.Host.Host, "localhost", StringComparison.OrdinalIgnoreCase)
            || string.Equals(Request.Host.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase)
            || string.Equals(Request.Host.Host, "::1", StringComparison.OrdinalIgnoreCase);
        var opts = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = Request.IsHttps || isLoopback,
            Expires = DateTimeOffset.UtcNow.AddDays(90),
            Path = "/"
        };
        Response.Cookies.Append(CartCookie, id.ToString(), opts);
        return id;
    }

    private async Task<(Guid? userId, Guid? cartId, Guid? cookieId)> ResolveIdsAsync()
    {
        Guid? userId = null; if (User?.Identity?.IsAuthenticated == true) userId = (await _users.GetUserAsync(User))?.Id;
        Guid? headerId = null;
        if (Request.Headers.TryGetValue("X-Cart-Id", out var headerVals))
        {
            var header = headerVals.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(header) && Guid.TryParse(header, out var headerGuid)) headerId = headerGuid;
        }
        Guid? cookieId = null;
        if (Request.Cookies.TryGetValue(CartCookie, out var raw) && Guid.TryParse(raw, out var anonId)) cookieId = anonId;
        var cartId = headerId ?? cookieId;
        return (userId, cartId, cookieId);
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var (uid, cid, cookieId) = await ResolveIdsAsync();
        var dto = await _svc.GetAsync(uid, cid, HttpContext.RequestAborted);
        if (cookieId is null && uid is null) EnsureCookie(dto.Id);
        return Ok(dto);
    }

    public sealed record MergeItem(Guid ProductId, [property: JsonPropertyName("qty")] int Qty);
    public sealed record MergeRequest(List<MergeItem> Items);

    [HttpPost("merge")]
    [Authorize]
    public async Task<IActionResult> Merge([FromBody] MergeRequest req)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var (_, _, cookieId) = await ResolveIdsAsync();
        var dto = await _svc.MergeAsync(user.Id, req.Items.Select(i => (i.ProductId, i.Qty)), cookieId, HttpContext.RequestAborted);
        if (cookieId.HasValue) Response.Cookies.Delete(CartCookie);
        try { await _audit.LogAsync("cart.merged", subjectType: nameof(Cart), subjectId: dto.Id.ToString(), metadata: new { items = dto.Items.Count }); } catch { }
        return Ok(dto);
    }

    // Add a product to current cart (anonymous or user)
    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] MergeItem req)
    {
        if (req.ProductId == Guid.Empty) return BadRequest("ProductId requerido");
        var (uid, cid, cookieId) = await ResolveIdsAsync();
        try
        {
            var dto = await _svc.AddAsync(uid, cid, req.ProductId, req.Qty, HttpContext.RequestAborted);
            try { await _audit.LogAsync("cart.item_added", subjectType: nameof(Cart), subjectId: dto.Id.ToString(), metadata: new { req.ProductId, req.Qty }); } catch { }
            if (cookieId is null && uid is null) EnsureCookie(dto.Id);
            return Ok(dto);
        }
        catch (KeyNotFoundException) { return NotFound("Product not available"); }
    }

    public sealed record UpdateQty([property: JsonPropertyName("qty")] int Qty);

    // Set quantity for a product
    [HttpPut("items/{productId}")]
    public async Task<IActionResult> SetQuantity([FromRoute] Guid productId, [FromBody] UpdateQty body)
    {
        if (productId == Guid.Empty) return BadRequest();
        var (uid, cid, _) = await ResolveIdsAsync();
        try
        {
            var dto = await _svc.SetQtyAsync(uid, cid, productId, Math.Max(0, body.Qty), HttpContext.RequestAborted);
            try { await _audit.LogAsync("cart.item_updated", subjectType: nameof(Cart), subjectId: dto.Id.ToString(), metadata: new { productId, body.Qty }); } catch { }
            return Ok(dto);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // Remove product from cart
    [HttpDelete("items/{productId}")]
    public async Task<IActionResult> RemoveItem([FromRoute] Guid productId)
    {
        var (uid, cid, _) = await ResolveIdsAsync();
        try
        {
            var dto = await _svc.RemoveAsync(uid, cid, productId, HttpContext.RequestAborted);
            try { await _audit.LogAsync("cart.item_removed", subjectType: nameof(Cart), subjectId: dto.Id.ToString(), metadata: new { productId }); } catch { }
            return Ok(dto);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // Clear cart
    [HttpDelete("clear")]
    public async Task<IActionResult> Clear()
    {
        var (uid, cid, cookieId) = await ResolveIdsAsync();
        var dto = await _svc.ClearAsync(uid, cid, HttpContext.RequestAborted);
        try { await _audit.LogAsync("cart.cleared", subjectType: nameof(Cart), subjectId: dto.Id.ToString()); } catch { }
        if (cookieId is null && uid is null) EnsureCookie(dto.Id);
        return Ok(dto);
    }

    // serialization now in service
}
