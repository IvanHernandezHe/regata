using Microsoft.EntityFrameworkCore;
using Roue.Application.DTOs;
using Roue.Application.Interface;
using Roue.Domain.Carts;
using Roue.Infrastructure.Persistence;

namespace Roue.Infrastructure.Services;

public sealed class CartService : ICartService
{
    private readonly AppDbContext _db;
    public CartService(AppDbContext db) { _db = db; }

    private async Task<Cart> GetOrCreateAsync(Guid? userId, Guid? cookieId, CancellationToken ct)
    {
        if (userId.HasValue)
        {
            var c = await _db.Carts.Include(x => x.Items).FirstOrDefaultAsync(x => x.UserId == userId, ct);
            if (c is null)
            {
                c = new Cart(); c.AttachToUser(userId.Value); _db.Carts.Add(c); await _db.SaveChangesAsync(ct);
                await _db.Entry(c).Collection(x => x.Items).LoadAsync(ct);
            }
            return c;
        }
        if (cookieId.HasValue)
        {
            var c = await _db.Carts.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == cookieId, ct);
            if (c is not null) return c;
        }
        var created = new Cart(); _db.Carts.Add(created); await _db.SaveChangesAsync(ct); return created;
    }

    public async Task<CartDto> GetAsync(Guid? userId, Guid? cookieCartId, CancellationToken ct = default)
    {
        var c = await GetOrCreateAsync(userId, cookieCartId, ct);
        await _db.Entry(c).Collection(x => x.Items).LoadAsync(ct);
        return await SerializeAsync(c, ct);
    }

    public async Task<CartDto> MergeAsync(Guid userId, IEnumerable<(Guid productId, int qty)> items, Guid? cookieCartId, CancellationToken ct = default)
    {
        var userCart = await GetOrCreateAsync(userId, null, ct);
        await _db.Entry(userCart).Collection(x => x.Items).LoadAsync(ct);
        Cart? anon = null;
        if (cookieCartId.HasValue)
            anon = await _db.Carts.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == cookieCartId && x.UserId == null, ct);
        var ids = items.Select(i => i.productId).Distinct().ToList();
        if (anon is not null) ids = ids.Union(anon.Items.Select(i => i.ProductId)).Distinct().ToList();
        var products = await _db.Products.AsNoTracking()
            .Include(p => p.Brand)
            .Where(p => ids.Contains(p.Id) && p.Active)
            .ToListAsync(ct);
        foreach (var it in items)
        {
            var p = products.FirstOrDefault(x => x.Id == it.productId); if (p is null) continue;
            var ex = userCart.Items.FirstOrDefault(i => i.ProductId == p.Id);
            if (ex is null) userCart.Items.Add(new CartItem(userCart.Id, p.Id, $"{p.Brand.Name} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price, Math.Max(1, it.qty)));
            else ex.Add(Math.Max(1, it.qty));
        }
        if (anon is not null)
        {
            foreach (var i in anon.Items)
            {
                var p = products.FirstOrDefault(x => x.Id == i.ProductId); if (p is null) continue;
                var ex = userCart.Items.FirstOrDefault(x => x.ProductId == i.ProductId);
                if (ex is null) userCart.Items.Add(new CartItem(userCart.Id, p.Id, $"{p.Brand.Name} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price, i.Quantity));
                else ex.Add(i.Quantity);
            }
            _db.Carts.Remove(anon);
        }
        userCart.Touch(); await _db.SaveChangesAsync(ct);
        return await SerializeAsync(userCart, ct);
    }

    public async Task<CartDto> AddAsync(Guid? userId, Guid? cookieCartId, Guid productId, int qty, CancellationToken ct = default)
    {
        var c = await GetOrCreateAsync(userId, cookieCartId, ct);
        await _db.Entry(c).Collection(x => x.Items).LoadAsync(ct);
        var p = await _db.Products.AsNoTracking().Include(x => x.Brand).FirstOrDefaultAsync(x => x.Id == productId && x.Active, ct);
        if (p is null) throw new KeyNotFoundException("Product not found");
        var ex = c.Items.FirstOrDefault(i => i.ProductId == p.Id);
        if (ex is null) c.Items.Add(new CartItem(c.Id, p.Id, $"{p.Brand.Name} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price, Math.Max(1, qty)));
        else ex.Add(Math.Max(1, qty));
        c.Touch(); await _db.SaveChangesAsync(ct);
        return await SerializeAsync(c, ct);
    }

    public async Task<CartDto> SetQtyAsync(Guid? userId, Guid? cookieCartId, Guid productId, int qty, CancellationToken ct = default)
    {
        var c = await GetOrCreateAsync(userId, cookieCartId, ct);
        await _db.Entry(c).Collection(x => x.Items).LoadAsync(ct);
        var it = c.Items.FirstOrDefault(i => i.ProductId == productId);
        if (it is null) throw new KeyNotFoundException();
        if (qty <= 0) c.Items.Remove(it); else it.SetQty(qty);
        c.Touch(); await _db.SaveChangesAsync(ct);
        return await SerializeAsync(c, ct);
    }

    public async Task<CartDto> RemoveAsync(Guid? userId, Guid? cookieCartId, Guid productId, CancellationToken ct = default)
    {
        var c = await GetOrCreateAsync(userId, cookieCartId, ct);
        await _db.Entry(c).Collection(x => x.Items).LoadAsync(ct);
        var it = c.Items.FirstOrDefault(i => i.ProductId == productId);
        if (it is null) throw new KeyNotFoundException();
        c.Items.Remove(it); c.Touch(); await _db.SaveChangesAsync(ct);
        return await SerializeAsync(c, ct);
    }

    public async Task<CartDto> ClearAsync(Guid? userId, Guid? cookieCartId, CancellationToken ct = default)
    {
        var c = await GetOrCreateAsync(userId, cookieCartId, ct);
        await _db.Entry(c).Collection(x => x.Items).LoadAsync(ct);
        c.Items.Clear(); c.Touch(); await _db.SaveChangesAsync(ct);
        return await SerializeAsync(c, ct);
    }

    private async Task<CartDto> SerializeAsync(Cart cart, CancellationToken ct)
    {
        var ids = cart.Items.Select(i => i.ProductId).Distinct().ToList();
        var now = DateTime.UtcNow;
        var onHands = await _db.Inventory.AsNoTracking()
            .Where(i => ids.Contains(i.ProductId))
            .Select(i => new { i.ProductId, i.OnHand })
            .ToDictionaryAsync(x => x.ProductId, x => x.OnHand, ct);
        var reserved = await _db.InventoryReservations.AsNoTracking()
            .Where(r => ids.Contains(r.ProductId) && r.Status == Domain.Inventory.ReservationStatus.Active && r.ExpiresAtUtc > now)
            .GroupBy(r => r.ProductId)
            .Select(g => new { ProductId = g.Key, Qty = g.Sum(x => x.Quantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.Qty, ct);
        var items = cart.Items.Select(i => new CartItemDto(i.ProductId, i.ProductName, i.ProductSku, i.Size, i.UnitPrice, i.Quantity,
            Math.Max(0, (onHands.TryGetValue(i.ProductId, out var oh) ? oh : 0) - (reserved.TryGetValue(i.ProductId, out var rv) ? rv : 0))
        )).ToList();
        var subtotal = items.Sum(i => i.Price * i.Qty);
        return new CartDto(cart.Id, cart.UserId, items, subtotal);
    }
}
