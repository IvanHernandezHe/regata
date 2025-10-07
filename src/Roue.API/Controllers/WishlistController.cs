using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Roue.Application.Interface;
using Roue.Domain.Wishlist;
using Roue.Infrastructure.Persistence;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class WishlistController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<IdentityUser<Guid>> _users;
    private readonly IAuditLogger _audit;
    public WishlistController(AppDbContext db, UserManager<IdentityUser<Guid>> users, IAuditLogger audit)
    { _db = db; _users = users; _audit = audit; }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var items = await _db.Wishlist.AsNoTracking()
            .Where(w => w.UserId == user.Id)
            .OrderByDescending(w => w.CreatedAtUtc)
            .Select(w => new { w.ProductId, w.ProductName, w.ProductSku, w.Size, w.Price, w.CreatedAtUtc })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("{productId}")]
    public async Task<IActionResult> Add([FromRoute] Guid productId)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var p = await _db.Products.AsNoTracking().Include(x => x.Brand).FirstOrDefaultAsync(x => x.Id == productId && x.Active);
        if (p is null) return NotFound();
        var exists = await _db.Wishlist.AnyAsync(x => x.UserId == user.Id && x.ProductId == p.Id);
        if (!exists)
        {
            _db.Wishlist.Add(new WishlistItem(user.Id, p.Id, $"{p.Brand.Name} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price));
            await _db.SaveChangesAsync();
            await _audit.LogAsync("wishlist.added", subjectType: nameof(WishlistItem), subjectId: p.Id.ToString());
        }
        return NoContent();
    }

    [HttpDelete("{productId}")]
    public async Task<IActionResult> Remove([FromRoute] Guid productId)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var item = await _db.Wishlist.FirstOrDefaultAsync(x => x.UserId == user.Id && x.ProductId == productId);
        if (item is null) return NotFound();
        _db.Wishlist.Remove(item);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("wishlist.removed", subjectType: nameof(WishlistItem), subjectId: productId.ToString());
        return NoContent();
    }

    [HttpPost("move-to-cart/{productId}")]
    public async Task<IActionResult> MoveToCart([FromRoute] Guid productId, [FromQuery] int qty = 1)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var item = await _db.Wishlist.FirstOrDefaultAsync(x => x.UserId == user.Id && x.ProductId == productId);
        if (item is null) return NotFound();
        var cart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == user.Id) ?? new Domain.Carts.Cart();
        if (cart.UserId == null) { cart.AttachToUser(user.Id); _db.Carts.Add(cart); await _db.SaveChangesAsync(); await _db.Entry(cart).Collection(c => c.Items).LoadAsync(); }
        var existing = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (existing is null)
            cart.Items.Add(new Domain.Carts.CartItem(cart.Id, productId, item.ProductName, item.ProductSku, item.Size, item.Price, Math.Max(1, qty)));
        else existing.Add(Math.Max(1, qty));
        _db.Wishlist.Remove(item);
        cart.Touch();
        await _db.SaveChangesAsync();
        await _audit.LogAsync("wishlist.moved_to_cart", subjectType: nameof(WishlistItem), subjectId: productId.ToString());
        return Ok(new { message = "moved", cartId = cart.Id });
    }
}
