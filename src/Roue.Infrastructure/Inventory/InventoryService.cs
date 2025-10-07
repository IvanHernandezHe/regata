using Microsoft.EntityFrameworkCore;
using Roue.Application.Interface;
using Roue.Domain.Inventory;
using Roue.Domain.Orders;
using Roue.Infrastructure.Persistence;

namespace Roue.Infrastructure.Inventory;

public sealed class InventoryService : IInventoryService
{
    private readonly AppDbContext _db;
    public InventoryService(AppDbContext db) { _db = db; }

    public async Task<(bool ok, string token, DateTime expiresAtUtc, string? error)> ReserveAsync(IEnumerable<(Guid productId, int qty)> lines, TimeSpan ttl, string reference, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var expires = now.Add(ttl);
        var token = Guid.NewGuid().ToString("n");
        using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var list = lines.ToList();
            var ids = list.Select(l => l.productId).Distinct().ToList();
            var invs = await _db.Inventory.Where(i => ids.Contains(i.ProductId)).ToDictionaryAsync(i => i.ProductId, ct);
            foreach (var l in list)
            {
                if (!invs.TryGetValue(l.productId, out var inv)) return (false, token, expires, "Producto sin inventario");
                var activeReserved = await _db.InventoryReservations
                    .Where(r => r.ProductId == l.productId && r.Status == ReservationStatus.Active && r.ExpiresAtUtc > now)
                    .SumAsync(r => (int?)r.Quantity, ct) ?? 0;
                var available = Math.Max(0, inv.OnHand - activeReserved);
                if (available < l.qty) return (false, token, expires, "Inventario insuficiente");
            }
            foreach (var l in list)
            {
                _db.InventoryReservations.Add(new InventoryReservation(l.productId, l.qty, expires, reference, token));
            }
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return (true, token, expires, null);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task ReleaseAsync(string token, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var rows = await _db.InventoryReservations.Where(r => r.Token == token && r.Status == ReservationStatus.Active).ToListAsync(ct);
        foreach (var r in rows)
        {
            if (r.ExpiresAtUtc <= now) r.Expire(); else r.Release();
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> CommitOnPaymentAsync(Order order, string? reservationToken = null, CancellationToken ct = default)
    {
        // Load order items if needed
        var items = await _db.OrderItems.AsNoTracking().Where(i => i.OrderId == order.Id).ToListAsync(ct);
        if (items.Count == 0) return true;

        using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var now = DateTime.UtcNow;
            foreach (var line in items)
            {
                var inv = await _db.Inventory.FirstOrDefaultAsync(x => x.ProductId == line.ProductId, ct);
                if (inv is null)
                {
                    inv = new InventoryItem(line.ProductId, 0);
                    _db.Inventory.Add(inv);
                }
                // If reservation token provided, validate and use it; else check availability
                if (!string.IsNullOrWhiteSpace(reservationToken))
                {
                    var reservedQty = await _db.InventoryReservations
                        .Where(r => r.Token == reservationToken && r.ProductId == line.ProductId && r.Status == ReservationStatus.Active && r.ExpiresAtUtc > now)
                        .SumAsync(r => (int?)r.Quantity, ct) ?? 0;
                    if (reservedQty < line.Quantity) return false;
                    // Mark reservations as committed (partial handling: mark all rows under token as committed)
                    var rows = await _db.InventoryReservations.Where(r => r.Token == reservationToken && r.ProductId == line.ProductId && r.Status == ReservationStatus.Active).ToListAsync(ct);
                    foreach (var r in rows) r.Commit();
                }
                else
                {
                    if (!inv.CanConsume(line.Quantity)) return false;
                }
                inv.Consume(line.Quantity);
                _db.InventoryTransactions.Add(new InventoryTransaction(line.ProductId, -line.Quantity, InventoryTxnType.Consume, order.Id.ToString()));
            }
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            await tx.RollbackAsync(ct);
            return false;
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
