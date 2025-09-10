using Microsoft.EntityFrameworkCore;
using Regata.Application.DTOs;
using Regata.Application.Interface;
using Regata.Domain.Inventory;
using Regata.Infrastructure.Persistence;

namespace Regata.Infrastructure.Services;

public sealed class InventoryAdminService : IInventoryAdminService
{
    private readonly AppDbContext _db;
    public InventoryAdminService(AppDbContext db) { _db = db; }

    public async Task<IReadOnlyList<InventoryRowDto>> ListAsync(Guid? productId, CancellationToken ct = default)
    {
        var q = _db.Inventory.AsNoTracking().AsQueryable();
        if (productId.HasValue) q = q.Where(i => i.ProductId == productId.Value);
        var list = await q
            .Join(_db.Products.AsNoTracking(), i => i.ProductId, p => p.Id,
                (i, p) => new InventoryRowDto(p.Id, p.Sku, p.Brand, p.ModelName, p.Size, i.OnHand, i.Reserved, i.Version))
            .ToListAsync(ct);
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

