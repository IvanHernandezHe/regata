using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Regata.Domain.Carts;
using Regata.Infrastructure.Persistence;
using Regata.Application.Interface;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CartController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<IdentityUser<Guid>> _users;
    private readonly IAuditLogger _audit;
    private const string CartCookie = "cart_id";

    public CartController(AppDbContext db, UserManager<IdentityUser<Guid>> users, IAuditLogger audit)
    { _db = db; _users = users; _audit = audit; }

    private Guid EnsureCookie(Guid id)
    {
        var opts = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = Request.IsHttps,
            Expires = DateTimeOffset.UtcNow.AddDays(90),
            Path = "/"
        };
        Response.Cookies.Append(CartCookie, id.ToString(), opts);
        return id;
    }

    private async Task<Cart> GetOrCreateCartAsync()
    {
        IdentityUser<Guid>? user = null;
        if (User?.Identity?.IsAuthenticated == true)
            user = await _users.GetUserAsync(User);

        if (user is not null)
        {
            var cart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == user.Id)
                ?? new Cart();
            if (cart.UserId == null)
            {
                cart.AttachToUser(user.Id);
                _db.Carts.Add(cart);
                await _db.SaveChangesAsync();
            }
            return cart;
        }
        // anonymous: from cookie, else new
        if (Request.Cookies.TryGetValue(CartCookie, out var raw) && Guid.TryParse(raw, out var anonId))
        {
            var existing = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == anonId);
            if (existing is not null) return existing;
        }
        var created = new Cart();
        _db.Carts.Add(created);
        await _db.SaveChangesAsync();
        EnsureCookie(created.Id);
        return created;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var cart = await GetOrCreateCartAsync();
        await _db.Entry(cart).Collection(c => c.Items).LoadAsync();
        return Ok(await SerializeAsync(cart));
    }

    public sealed record MergeItem(Guid ProductId, int Qty);
    public sealed record MergeRequest(List<MergeItem> Items);

    [HttpPost("merge")]
    [Authorize]
    public async Task<IActionResult> Merge([FromBody] MergeRequest req)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var userCart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == user.Id);
        if (userCart is null)
        {
            userCart = new Cart();
            userCart.AttachToUser(user.Id);
            _db.Carts.Add(userCart);
            await _db.SaveChangesAsync();
            await _db.Entry(userCart).Collection(c => c.Items).LoadAsync();
        }

        // If anonymous cart cookie exists, optionally merge it too
        Cart? anonCart = null;
        if (Request.Cookies.TryGetValue(CartCookie, out var raw) && Guid.TryParse(raw, out var anonId))
        {
            anonCart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.Id == anonId && c.UserId == null);
        }

        var ids = req.Items.Select(i => i.ProductId).Distinct().ToList();
        if (anonCart is not null)
            ids = ids.Union(anonCart.Items.Select(i => i.ProductId)).Distinct().ToList();

        var products = await _db.Products.AsNoTracking().Where(p => ids.Contains(p.Id) && p.Active).ToListAsync();

        // merge provided list
        foreach (var item in req.Items)
        {
            var p = products.FirstOrDefault(x => x.Id == item.ProductId);
            if (p is null) continue;
            var existing = userCart.Items.FirstOrDefault(i => i.ProductId == p.Id);
            if (existing is null)
            {
                userCart.Items.Add(new CartItem(userCart.Id, p.Id, $"{p.Brand} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price, Math.Max(1, item.Qty)));
            }
            else
            {
                existing.Add(Math.Max(1, item.Qty));
            }
        }

        // merge anon cart items
        if (anonCart is not null)
        {
            foreach (var i in anonCart.Items)
            {
                var p = products.FirstOrDefault(x => x.Id == i.ProductId);
                if (p is null) continue;
                var existing = userCart.Items.FirstOrDefault(x => x.ProductId == i.ProductId);
                if (existing is null)
                {
                    userCart.Items.Add(new CartItem(userCart.Id, p.Id, $"{p.Brand} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price, i.Quantity));
                }
                else
                {
                    existing.Add(i.Quantity);
                }
            }
        }

        userCart.Touch();
        await _db.SaveChangesAsync();
        try { await _audit.LogAsync("cart.merged", subjectType: nameof(Cart), subjectId: userCart.Id.ToString(), metadata: new { items = userCart.Items.Count }); } catch { }

        // optionally clear anonymous cart
        if (anonCart is not null)
        {
            _db.Carts.Remove(anonCart);
            await _db.SaveChangesAsync();
            Response.Cookies.Delete(CartCookie);
        }

        return Ok(await SerializeAsync(userCart));
    }

    // Add a product to current cart (anonymous or user)
    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] MergeItem req)
    {
        if (req.ProductId == Guid.Empty) return BadRequest("ProductId requerido");
        var cart = await GetOrCreateCartAsync();
        await _db.Entry(cart).Collection(c => c.Items).LoadAsync();
        var p = await _db.Products.AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.ProductId && x.Active);
        if (p is null) return NotFound("Producto no disponible");
        var existing = cart.Items.FirstOrDefault(i => i.ProductId == p.Id);
        if (existing is null)
            cart.Items.Add(new CartItem(cart.Id, p.Id, $"{p.Brand} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price, Math.Max(1, req.Qty)));
        else
            existing.Add(Math.Max(1, req.Qty));
        cart.Touch();
        await _db.SaveChangesAsync();
        try { await _audit.LogAsync("cart.item_added", subjectType: nameof(Cart), subjectId: cart.Id.ToString(), metadata: new { p.Id, req.Qty }); } catch { }
        return Ok(await SerializeAsync(cart));
    }

    public sealed record UpdateQty(int Qty);

    // Set quantity for a product
    [HttpPut("items/{productId}")]
    public async Task<IActionResult> SetQuantity([FromRoute] Guid productId, [FromBody] UpdateQty body)
    {
        if (productId == Guid.Empty) return BadRequest();
        var cart = await GetOrCreateCartAsync();
        await _db.Entry(cart).Collection(c => c.Items).LoadAsync();
        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item is null) return NotFound();
        item.SetQty(Math.Max(0, body.Qty));
        if (item.Quantity < 1) cart.Items.Remove(item);
        cart.Touch();
        await _db.SaveChangesAsync();
        try { await _audit.LogAsync("cart.item_updated", subjectType: nameof(Cart), subjectId: cart.Id.ToString(), metadata: new { productId, body.Qty }); } catch { }
        return Ok(await SerializeAsync(cart));
    }

    // Remove product from cart
    [HttpDelete("items/{productId}")]
    public async Task<IActionResult> RemoveItem([FromRoute] Guid productId)
    {
        var cart = await GetOrCreateCartAsync();
        await _db.Entry(cart).Collection(c => c.Items).LoadAsync();
        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item is null) return NotFound();
        cart.Items.Remove(item);
        cart.Touch();
        await _db.SaveChangesAsync();
        try { await _audit.LogAsync("cart.item_removed", subjectType: nameof(Cart), subjectId: cart.Id.ToString(), metadata: new { productId }); } catch { }
        return Ok(await SerializeAsync(cart));
    }

    // Clear cart
    [HttpDelete("clear")]
    public async Task<IActionResult> Clear()
    {
        var cart = await GetOrCreateCartAsync();
        await _db.Entry(cart).Collection(c => c.Items).LoadAsync();
        cart.Items.Clear();
        cart.Touch();
        await _db.SaveChangesAsync();
        try { await _audit.LogAsync("cart.cleared", subjectType: nameof(Cart), subjectId: cart.Id.ToString()); } catch { }
        return Ok(await SerializeAsync(cart));
    }

    private async Task<object> SerializeAsync(Cart cart)
    {
        var ids = cart.Items.Select(i => i.ProductId).Distinct().ToList();
        var now = DateTime.UtcNow;
        var onHands = await _db.Inventory.AsNoTracking()
            .Where(i => ids.Contains(i.ProductId))
            .Select(i => new { i.ProductId, i.OnHand })
            .ToDictionaryAsync(x => x.ProductId, x => x.OnHand);
        var reserved = await _db.InventoryReservations.AsNoTracking()
            .Where(r => ids.Contains(r.ProductId) && r.Status == Domain.Inventory.ReservationStatus.Active && r.ExpiresAtUtc > now)
            .GroupBy(r => r.ProductId)
            .Select(g => new { ProductId = g.Key, Qty = g.Sum(x => x.Quantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.Qty);
        return new
        {
            id = cart.Id,
            userId = cart.UserId,
            items = cart.Items.Select(i => new
            {
                productId = i.ProductId,
                name = i.ProductName,
                sku = i.ProductSku,
                size = i.Size,
                price = i.UnitPrice,
                qty = i.Quantity,
                stock = Math.Max(0, (onHands.TryGetValue(i.ProductId, out var oh) ? oh : 0) - (reserved.TryGetValue(i.ProductId, out var rv) ? rv : 0))
            }).ToList(),
            subtotal = cart.Items.Sum(i => i.UnitPrice * i.Quantity)
        };
    }
}
