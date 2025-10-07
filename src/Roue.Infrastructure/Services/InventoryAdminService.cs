using Microsoft.EntityFrameworkCore;
using Roue.Application.DTOs;
using Roue.Application.Interface;
using Roue.Domain.Inventory;
using Roue.Infrastructure.Persistence;

namespace Roue.Infrastructure.Services;

public sealed class InventoryAdminService : IInventoryAdminService
{
    private readonly AppDbContext _db;
    public InventoryAdminService(AppDbContext db) { _db = db; }

    public async Task<IReadOnlyList<InventoryRowDto>> ListAsync(Guid? productId, CancellationToken ct = default)
    {
        var q = _db.Inventory.AsNoTracking().AsQueryable();
        if (productId.HasValue) q = q.Where(i => i.ProductId == productId.Value);
        var list = await (
            from i in q
            join p in _db.Products.AsNoTracking() on i.ProductId equals p.Id
            join b in _db.Brands.AsNoTracking() on p.BrandId equals b.Id
            select new InventoryRowDto(p.Id, p.Sku, b.Name, p.ModelName, p.Size, i.OnHand, i.Reserved, i.Version)
        ).ToListAsync(ct);
        return list;
    }

    public async Task<PagedResultDto<InventoryTxnDto>> TransactionsAsync(Guid? productId, DateTime? from, DateTime? to, int page, int pageSize, CancellationToken ct = default)
    {
        var q = _db.InventoryTransactions.AsNoTracking().AsQueryable();
        if (productId.HasValue) q = q.Where(t => t.ProductId == productId.Value);
        if (from.HasValue) q = q.Where(t => t.CreatedAtUtc >= from.Value);
        if (to.HasValue) q = q.Where(t => t.CreatedAtUtc <= to.Value);
        var total = await q.LongCountAsync(ct);
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 500);
        var items = await q.OrderByDescending(t => t.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new InventoryTxnDto(t.Id, t.ProductId, t.Quantity, t.Type.ToString(), t.Reference, t.CreatedAtUtc))
            .ToListAsync(ct);
        return new PagedResultDto<InventoryTxnDto>(total, page, pageSize, items);
    }

    public async Task AdjustAsync(Guid productId, int delta, string? reason, CancellationToken ct = default)
    {
        var inv = await _db.Inventory.FirstOrDefaultAsync(i => i.ProductId == productId, ct);
        if (inv is null) { inv = new InventoryItem(productId, 0); _db.Inventory.Add(inv); }
        inv.Adjust(delta);
        _db.InventoryTransactions.Add(new InventoryTransaction(productId, delta, InventoryTxnType.Adjust, reason ?? "manual"));
        await _db.SaveChangesAsync(ct);
    }
}
