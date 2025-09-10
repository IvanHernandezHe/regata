using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Regata.Application.DTOs;
using Regata.Application.Interface;
using Regata.Domain.Orders;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class OrdersController : ControllerBase
{
    private readonly UserManager<IdentityUser<Guid>> _users;
    private readonly IAuditLogger _audit;
    private readonly IOrdersService _svc;
    private readonly IInventoryService _inventory;
    public OrdersController(UserManager<IdentityUser<Guid>> users, IAuditLogger audit, IOrdersService svc, IInventoryService inventory)
    { _users = users; _audit = audit; _svc = svc; _inventory = inventory; }

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var list = await _svc.GetMineAsync(user.Id, 20, HttpContext.RequestAborted);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var detail = await _svc.GetByIdAsync(user.Id, id, HttpContext.RequestAborted);
        if (detail is null) return NotFound();
        return Ok(detail);
    }

    public sealed record CheckoutItem(Guid ProductId, int Quantity);
    public sealed record CheckoutRequest(List<CheckoutItem> Items, string? DiscountCode, string? ReservationToken, Guid? AddressId);
    public sealed record CheckoutResponse(Guid OrderId, decimal Subtotal, decimal Discount, decimal Shipping, decimal Total, string Currency, string CheckoutUrl);
    public sealed record QuoteResponse(decimal Subtotal, decimal Discount, decimal Shipping, decimal Total, string Currency, object[] Items);
    public sealed record ReserveRequest(List<CheckoutItem> Items, int TtlSeconds = 600);
    public sealed record ReserveResponse(string Token, DateTime ExpiresAtUtc);
    public sealed record ReleaseReservationRequest(string Token);

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var lines = req.Items?.Select(i => new CheckoutLineDto(i.ProductId, i.Quantity)).ToList() ?? new List<CheckoutLineDto>();
        if (lines.Count == 0) return BadRequest("No items provided for checkout.");
        CheckoutResponseDto result;
        try { result = await _svc.CheckoutAsync(user.Id, lines, req.DiscountCode, req.AddressId, req.ReservationToken, HttpContext.RequestAborted); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        var checkoutUrl = Url.ActionLink(nameof(PaySandbox), values: new { orderId = result.OrderId }) ?? $"/api/orders/pay/sandbox/{result.OrderId}";
        await _audit.LogAsync("order.checkout_initiated", subjectType: nameof(Order), subjectId: result.OrderId.ToString(), metadata: new { result.Total, result.Subtotal, result.Discount });
        return CreatedAtAction(nameof(GetMine), new { }, new { result.OrderId, result.Subtotal, result.Discount, result.Shipping, result.Total, result.Currency, CheckoutUrl = checkoutUrl });
    }

    [HttpPost("quote")]
    [AllowAnonymous]
    public async Task<IActionResult> Quote([FromBody] CheckoutRequest req)
    {
        var qLines = req.Items?.Select(i => new CheckoutLineDto(i.ProductId, i.Quantity)).ToList() ?? new List<CheckoutLineDto>();
        if (qLines.Count == 0) return BadRequest("No items provided.");
        try { var quote = await _svc.QuoteAsync(qLines, req.DiscountCode, HttpContext.RequestAborted); return Ok(quote); }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    // Sandbox payment flow: marks the order as paid and redirects to /perfil on the SPA
    [HttpGet("pay/sandbox/{orderId}")]
    public async Task<IActionResult> PaySandbox([FromRoute] Guid orderId)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        try
        {
            var ok = await _svc.MarkPaidSandboxAsync(user.Id, orderId, HttpContext.RequestAborted);
            await _audit.LogAsync(ok ? "order.paid_sandbox" : "order.paid_sandbox_inventory_short",
                subjectType: nameof(Order), subjectId: orderId.ToString());
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }

        // minimal HTML response redirecting back to SPA profile
        var html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"refresh\" content=\"0;url=/perfil\"><title>Sandbox Payment</title></head><body>Sandbox payment successful. Redirecting…</body></html>";
        return Content(html, "text/html");
    }

    [HttpPost("reserve")]
    [AllowAnonymous]
    public async Task<IActionResult> Reserve([FromBody] ReserveRequest req)
    {
        var rLines = req.Items?.Select(i => new CheckoutLineDto(i.ProductId, i.Quantity)).ToList() ?? new List<CheckoutLineDto>();
        if (rLines.Count == 0) return BadRequest("No items");
        try { var res = await _svc.ReserveAsync(rLines, req.TtlSeconds, HttpContext.RequestAborted); return Ok(res); }
        catch (Exception ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpPost("release")]
    [AllowAnonymous]
    public async Task<IActionResult> Release([FromBody] ReleaseReservationRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Token)) return BadRequest();
        await _svc.ReleaseAsync(req.Token, HttpContext.RequestAborted);
        await _audit.LogAsync("inventory.reservation_released", subjectType: "Reservation", subjectId: req.Token);
        return NoContent();
    }
}
