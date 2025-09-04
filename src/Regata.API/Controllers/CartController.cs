using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Regata.Domain.Carts;
using Regata.Infrastructure.Persistence;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CartController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<IdentityUser<Guid>> _users;
    private const string CartCookie = "cart_id";

    public CartController(AppDbContext db, UserManager<IdentityUser<Guid>> users)
    { _db = db; _users = users; }

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
        return Ok(Serialize(cart));
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

        // optionally clear anonymous cart
        if (anonCart is not null)
        {
            _db.Carts.Remove(anonCart);
            await _db.SaveChangesAsync();
            Response.Cookies.Delete(CartCookie);
        }

        return Ok(Serialize(userCart));
    }

    private static object Serialize(Cart cart) => new
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
            qty = i.Quantity
        }).ToList(),
        subtotal = cart.Items.Sum(i => i.UnitPrice * i.Quantity)
    };
}

