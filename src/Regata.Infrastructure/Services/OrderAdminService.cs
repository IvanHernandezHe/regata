using Microsoft.EntityFrameworkCore;
using Regata.Application.DTOs;
using Regata.Application.Interface;
using Regata.Domain.Orders;
using Regata.Infrastructure.Persistence;

namespace Regata.Infrastructure.Services;

public sealed class OrderAdminService : IOrderAdminService
{
    private readonly AppDbContext _db;
    public OrderAdminService(AppDbContext db) { _db = db; }

    public async Task<(long total, IReadOnlyList<AdminOrderSummaryDto> items)> ListAsync(OrderStatus? status, PaymentStatus? paymentStatus, int page, int pageSize, CancellationToken ct = default)
    {
        var q = _db.Orders.AsNoTracking().AsQueryable();
        if (status.HasValue) q = q.Where(o => o.Status == status);
        if (paymentStatus.HasValue) q = q.Where(o => o.PaymentStatus == paymentStatus);
        var total = await q.LongCountAsync(ct);
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 200);
        var slice = await q.OrderByDescending(o => o.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new { o.Id, o.Total, o.Subtotal, o.DiscountAmount, o.ShippingCost, o.Status, o.PaymentStatus, o.CreatedAtUtc, o.UserId })
            .ToListAsync(ct);
        var userIds = slice.Select(i => i.UserId).Distinct().ToList();
        var users = await _db.Users.AsNoTracking().Where(u => userIds.Contains(u.Id)).Select(u => new { u.Id, u.Email }).ToListAsync(ct);
        var items = slice.Select(i => new AdminOrderSummaryDto(
            i.Id,
            users.FirstOrDefault(u => u.Id == i.UserId)?.Email,
            i.Subtotal,
            i.DiscountAmount,
            i.ShippingCost,
            i.Total,
            i.Status,
            i.PaymentStatus,
            i.CreatedAtUtc
        )).ToList();
        return (total, items);
    }

    public async Task<AdminOrderDetailDto?> GetAsync(Guid id, CancellationToken ct = default)
    {
        var o = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (o is null) return null;
        var items = await _db.OrderItems.AsNoTracking().Where(i => i.OrderId == id)
            .Select(i => new AdminOrderItemDto(i.ProductId, i.ProductName, i.ProductSku, i.Size, i.UnitPrice, i.Quantity)).ToListAsync(ct);
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == o.UserId, ct);
        var ship = new ShipDto(o.ShipLine1, o.ShipLine2, o.ShipCity, o.ShipState, o.ShipPostalCode, o.ShipCountry);
        return new AdminOrderDetailDto(
            o.Id,
            user?.Email,
            o.Subtotal,
            o.DiscountAmount,
            o.ShippingCost,
            o.Total,
            o.Currency,
            o.Status,
            o.PaymentStatus,
            o.PaymentProvider,
            o.PaymentReference,
            o.CreatedAtUtc,
            ship,
            items
        );
    }

    public async Task SetStatusAsync(Guid id, OrderStatus status, CancellationToken ct = default)
    {
        var o = await _db.Orders.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (o is null) throw new KeyNotFoundException();
        o.GetType().GetProperty(nameof(Order.Status))!.SetValue(o, status);
        await _db.SaveChangesAsync(ct);
    }

    public async Task SetPaymentStatusAsync(Guid id, PaymentStatus paymentStatus, CancellationToken ct = default)
    {
        var o = await _db.Orders.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (o is null) throw new KeyNotFoundException();
        o.GetType().GetProperty(nameof(Order.PaymentStatus))!.SetValue(o, paymentStatus);
        await _db.SaveChangesAsync(ct);
    }
}

