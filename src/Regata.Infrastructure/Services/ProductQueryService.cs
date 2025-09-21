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

    public async Task<IReadOnlyList<ProductListItemDto>> SearchAsync(string? q, string? category = null, int take = 50, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var baseQuery = _db.Products.AsNoTracking().Where(p => p.Active);
        if (!string.IsNullOrWhiteSpace(q))
            baseQuery = baseQuery.Where(p => p.Brand.Contains(q) || p.ModelName.Contains(q) || p.Sku.Contains(q));

        var list = await (
            from p in baseQuery
            join br in _db.Brands.AsNoTracking() on p.BrandId equals br.Id into bjoin
            from b in bjoin.DefaultIfEmpty()
            join cat in _db.ProductCategories.AsNoTracking() on p.CategoryId equals cat.Id into cjoin
            from c in cjoin.DefaultIfEmpty()
            join i in _db.Inventory.AsNoTracking() on p.Id equals i.ProductId into invJoin
            from inv in invJoin.DefaultIfEmpty()
            let reserved = (_db.InventoryReservations
                .Where(r => r.ProductId == p.Id && r.Status == ReservationStatus.Active && r.ExpiresAtUtc > now)
                .Sum(r => (int?)r.Quantity)) ?? 0
            let onHand = inv == null ? 0 : inv.OnHand
            let stock = (onHand - reserved) < 0 ? 0 : (onHand - reserved)
            let brandName = b != null ? b.Name : p.Brand
            where string.IsNullOrEmpty(category) || (c != null && (c.Slug == category || c.Name == category))
            orderby brandName
            select new ProductListItemDto(p.Id, p.Sku, brandName!, p.ModelName, p.Size, p.Price, p.Active, stock, c != null ? c.Name : null)
        ).Take(take).ToListAsync(ct);
        return list;
    }

    public async Task<ProductDetailDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var row = await (
            from p in _db.Products.AsNoTracking().Where(x => x.Id == id && x.Active)
            join br in _db.Brands.AsNoTracking() on p.BrandId equals br.Id into bjoin
            from b in bjoin.DefaultIfEmpty()
            join cat in _db.ProductCategories.AsNoTracking() on p.CategoryId equals cat.Id into cjoin
            from c in cjoin.DefaultIfEmpty()
            join i in _db.Inventory.AsNoTracking() on p.Id equals i.ProductId into invJoin
            from inv in invJoin.DefaultIfEmpty()
            let reserved = (_db.InventoryReservations
                .Where(r => r.ProductId == p.Id && r.Status == ReservationStatus.Active && r.ExpiresAtUtc > now)
                .Sum(r => (int?)r.Quantity)) ?? 0
            let onHand = inv == null ? 0 : inv.OnHand
            let stock = (onHand - reserved) < 0 ? 0 : (onHand - reserved)
            select new {
                p.Id, p.Sku, Brand = (string?)(b != null ? b.Name : p.Brand), p.ModelName, p.Size, p.Price, p.Active,
                Stock = stock,
                BrandLogoUrl = (string?)(b != null ? b.LogoUrl : null), p.ImagesJson,
                Tire = _db.TireSpecs.AsNoTracking().FirstOrDefault(ts => ts.ProductId == p.Id),
                Rim = _db.RimSpecs.AsNoTracking().FirstOrDefault(rs => rs.ProductId == p.Id),
                Category = (string?)(c != null ? c.Name : null)
            }
        ).FirstOrDefaultAsync(ct);
        if (row is null) return null;
        IReadOnlyList<string> images = Array.Empty<string>();
        if (!string.IsNullOrWhiteSpace(row.ImagesJson))
        {
            try { images = System.Text.Json.JsonSerializer.Deserialize<string[]>(row.ImagesJson!) ?? Array.Empty<string>(); }
            catch { images = Array.Empty<string>(); }
        }
        TireSpecsDto? tire = null;
        RimSpecsDto? rim = null;
        if (row.Tire is not null)
            tire = new TireSpecsDto(row.Tire.Type, row.Tire.LoadIndex, row.Tire.SpeedRating);
        if (row.Rim is not null)
            rim = new RimSpecsDto(row.Rim.DiameterIn, row.Rim.WidthIn, row.Rim.BoltPattern, row.Rim.OffsetMm, row.Rim.CenterBoreMm, row.Rim.Material, row.Rim.Finish);
        return new ProductDetailDto(row.Id, row.Sku, row.Brand ?? string.Empty, row.ModelName, row.Size, row.Price, row.Active, row.Stock,
            row.BrandLogoUrl, images, tire, rim, row.Category);
    }
}
