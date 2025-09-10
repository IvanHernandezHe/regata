using Microsoft.EntityFrameworkCore;
using Regata.Application.DTOs;
using Regata.Application.Interface;
using Regata.Domain.Inventory;
using Regata.Infrastructure.Persistence;

namespace Regata.Infrastructure.Services;

public sealed class ProductQueryService : IProductQueryService
{
    private readonly AppDbContext _db;
    public ProductQueryService(AppDbContext db) { _db = db; }

    public async Task<IReadOnlyList<ProductListItemDto>> SearchAsync(string? q, int take = 50, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var baseQuery = _db.Products.AsNoTracking().Where(p => p.Active);
        if (!string.IsNullOrWhiteSpace(q))
            baseQuery = baseQuery.Where(p => p.Brand.Contains(q) || p.ModelName.Contains(q) || p.Sku.Contains(q));

        var list = await (
            from p in baseQuery
            join i in _db.Inventory.AsNoTracking() on p.Id equals i.ProductId into invJoin
            from inv in invJoin.DefaultIfEmpty()
            let reserved = (_db.InventoryReservations
                .Where(r => r.ProductId == p.Id && r.Status == ReservationStatus.Active && r.ExpiresAtUtc > now)
                .Sum(r => (int?)r.Quantity)) ?? 0
            let onHand = inv == null ? 0 : inv.OnHand
            let stock = (onHand - reserved) < 0 ? 0 : (onHand - reserved)
            orderby p.Brand
            select new ProductListItemDto(p.Id, p.Sku, p.Brand, p.ModelName, p.Size, p.Price, p.Active, stock)
        ).Take(take).ToListAsync(ct);
        return list;
    }

    public async Task<ProductDetailDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var item = await (
            from p in _db.Products.AsNoTracking().Where(x => x.Id == id && x.Active)
            join i in _db.Inventory.AsNoTracking() on p.Id equals i.ProductId into invJoin
            from inv in invJoin.DefaultIfEmpty()
            let reserved = (_db.InventoryReservations
                .Where(r => r.ProductId == p.Id && r.Status == ReservationStatus.Active && r.ExpiresAtUtc > now)
                .Sum(r => (int?)r.Quantity)) ?? 0
            let onHand = inv == null ? 0 : inv.OnHand
            let stock = (onHand - reserved) < 0 ? 0 : (onHand - reserved)
            select new ProductDetailDto(p.Id, p.Sku, p.Brand, p.ModelName, p.Size, p.Price, p.Active, stock)
        ).FirstOrDefaultAsync(ct);
        return item;
    }
}

