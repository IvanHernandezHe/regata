using Microsoft.EntityFrameworkCore;
using Roue.Application.DTOs;
using Roue.Application.Interface;
using Roue.Domain.Inventory;
using Roue.Infrastructure.Persistence;

namespace Roue.Infrastructure.Services;

public sealed class ProductQueryService : IProductQueryService
{
    private readonly AppDbContext _db;
    public ProductQueryService(AppDbContext db) { _db = db; }

    public async Task<IReadOnlyList<ProductListItemDto>> SearchAsync(string? q, string? category = null, int take = 50, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var query =
            from p in _db.Products.AsNoTracking().Where(p => p.Active)
            join br in _db.Brands.AsNoTracking() on p.BrandId equals br.Id
            join cat in _db.ProductCategories.AsNoTracking() on p.CategoryId equals cat.Id into cjoin
            from c in cjoin.DefaultIfEmpty()
            join inv in _db.Inventory.AsNoTracking() on p.Id equals inv.ProductId into invJoin
            from inv in invJoin.DefaultIfEmpty()
            select new { Product = p, Brand = br, Category = c, Inventory = inv };

        if (!string.IsNullOrWhiteSpace(q))
        {
            query = query.Where(row => row.Brand.Name.Contains(q) || row.Product.ModelName.Contains(q) || row.Product.Sku.Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(row => row.Category != null && (row.Category.Slug == category || row.Category.Name == category));
        }

        var list = await (
            from row in query
            let reserved = (_db.InventoryReservations
                .Where(r => r.ProductId == row.Product.Id && r.Status == ReservationStatus.Active && r.ExpiresAtUtc > now)
                .Sum(r => (int?)r.Quantity)) ?? 0
            let onHand = row.Inventory == null ? 0 : row.Inventory.OnHand
            let stock = (onHand - reserved) < 0 ? 0 : (onHand - reserved)
            orderby row.Brand.Name
            select new ProductListItemDto(row.Product.Id, row.Product.Sku, row.Brand.Name, row.Product.ModelName, row.Product.Size, row.Product.Price, row.Product.Active, stock, row.Category != null ? row.Category.Name : null)
        ).Take(take).ToListAsync(ct);
        return list;
    }

    public async Task<ProductDetailDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var row = await (
            from p in _db.Products.AsNoTracking().Where(x => x.Id == id && x.Active)
            join br in _db.Brands.AsNoTracking() on p.BrandId equals br.Id
            join cat in _db.ProductCategories.AsNoTracking() on p.CategoryId equals cat.Id into cjoin
            from c in cjoin.DefaultIfEmpty()
            join inv in _db.Inventory.AsNoTracking() on p.Id equals inv.ProductId into invJoin
            from inv in invJoin.DefaultIfEmpty()
            select new { Product = p, Brand = br, Category = c, Inventory = inv }
        ).FirstOrDefaultAsync(ct);
        if (row is null) return null;
        var reserved = await _db.InventoryReservations
            .Where(r => r.ProductId == id && r.Status == ReservationStatus.Active && r.ExpiresAtUtc > now)
            .SumAsync(r => (int?)r.Quantity, ct) ?? 0;
        var onHand = row.Inventory?.OnHand ?? 0;
        var stock = (onHand - reserved) < 0 ? 0 : (onHand - reserved);

        IReadOnlyList<string> images = Array.Empty<string>();
        if (!string.IsNullOrWhiteSpace(row.Product.ImagesJson))
        {
            try { images = System.Text.Json.JsonSerializer.Deserialize<string[]>(row.Product.ImagesJson!) ?? Array.Empty<string>(); }
            catch { images = Array.Empty<string>(); }
        }
        var tireSpecs = await _db.TireSpecs.AsNoTracking().FirstOrDefaultAsync(ts => ts.ProductId == id, ct);
        var rimSpecs = await _db.RimSpecs.AsNoTracking().FirstOrDefaultAsync(rs => rs.ProductId == id, ct);

        TireSpecsDto? tire = tireSpecs is null ? null : new TireSpecsDto(tireSpecs.Type, tireSpecs.LoadIndex, tireSpecs.SpeedRating);
        RimSpecsDto? rim = rimSpecs is null ? null : new RimSpecsDto(rimSpecs.DiameterIn, rimSpecs.WidthIn, rimSpecs.BoltPattern, rimSpecs.OffsetMm, rimSpecs.CenterBoreMm, rimSpecs.Material, rimSpecs.Finish);

        return new ProductDetailDto(row.Product.Id, row.Product.Sku, row.Brand.Name, row.Product.ModelName, row.Product.Size, row.Product.Price, row.Product.Active, stock,
            row.Brand.LogoUrl, images, tire, rim, row.Category?.Name);
    }
}
