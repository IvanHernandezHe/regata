using Microsoft.EntityFrameworkCore;
using Roue.Application.DTOs;
using Roue.Application.Interface;
using Roue.Domain.Orders;
using Roue.Infrastructure.Persistence;

namespace Roue.Infrastructure.Services;

public sealed class OrderAdminService : IOrderAdminService
{
    private readonly AppDbContext _db;
    private readonly IShippingCalculator _shipping;
    public OrderAdminService(AppDbContext db, IShippingCalculator shipping) { _db = db; _shipping = shipping; }

    private async Task ApplyDiscountAndTotalsAsync(Domain.Orders.Order o, CancellationToken ct)
    {
        // Recalculate subtotal from items
        await _db.Entry(o).Collection(x => x.Items).LoadAsync(ct);
        var subtotal = o.Items.Sum(i => i.UnitPrice * i.Quantity);
        decimal discount = 0m;
        if (!string.IsNullOrWhiteSpace(o.DiscountCode))
        {
            var code = o.DiscountCode!.Trim();
            var dc = await _db.DiscountCodes.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code && x.Active && (!x.ExpiresAtUtc.HasValue || x.ExpiresAtUtc > DateTime.UtcNow) && x.Redemptions < x.MaxRedemptions, ct);
            if (dc is not null)
            {
                if (dc.Type == Domain.Marketing.DiscountType.Percentage) discount = Math.Round(subtotal * (dc.Value / 100m), 2, MidpointRounding.AwayFromZero);
                else if (dc.Type == Domain.Marketing.DiscountType.FixedAmount) discount = Math.Max(0m, Math.Min(subtotal, dc.Value));
            }
        }
        var shipping = await _shipping.CalculateAsync(subtotal, ct);
        var total = Math.Max(0m, subtotal - discount + shipping);
        o.GetType().GetProperty(nameof(Domain.Orders.Order.Subtotal))!.SetValue(o, subtotal);
        o.GetType().GetProperty(nameof(Domain.Orders.Order.DiscountAmount))!.SetValue(o, discount);
        o.GetType().GetProperty(nameof(Domain.Orders.Order.ShippingCost))!.SetValue(o, shipping);
        o.GetType().GetProperty(nameof(Domain.Orders.Order.Total))!.SetValue(o, total);
    }

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
        var ship = new ShipDto(o.ShipLine1, o.ShipLine2, o.ShipCity, o.ShipState, o.ShipPostalCode, o.ShipCountry, o.ShipTrackingCarrier, o.ShipTrackingCode, o.ShippedAtUtc);
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

    public async Task SetShipmentAsync(Guid id, string? carrier, string? trackingCode, DateTime? shippedAtUtc, CancellationToken ct = default)
    {
        var o = await _db.Orders.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (o is null) throw new KeyNotFoundException();
        o.GetType().GetProperty(nameof(Order.ShipTrackingCarrier))!.SetValue(o, string.IsNullOrWhiteSpace(carrier) ? null : carrier);
        o.GetType().GetProperty(nameof(Order.ShipTrackingCode))!.SetValue(o, string.IsNullOrWhiteSpace(trackingCode) ? null : trackingCode);
        o.GetType().GetProperty(nameof(Order.ShippedAtUtc))!.SetValue(o, shippedAtUtc);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<AdminOrderDetailDto> CreateAsync(Guid userId, IEnumerable<(Guid productId, int qty)> items, string? discountCode, CancellationToken ct = default)
    {
        var o = new Order();
        o.GetType().GetProperty(nameof(Order.UserId))!.SetValue(o, userId);
        if (!string.IsNullOrWhiteSpace(discountCode)) o.GetType().GetProperty(nameof(Order.DiscountCode))!.SetValue(o, discountCode);
        o.GetType().GetProperty(nameof(Order.Currency))!.SetValue(o, "MXN");
        _db.Orders.Add(o);
        await _db.SaveChangesAsync(ct);

        var list = items?.ToList() ?? new List<(Guid productId, int qty)>();
        var ids = list.Select(x => x.productId).Distinct().ToList();
        var products = await _db.Products.AsNoTracking()
            .Include(p => p.Brand)
            .Where(p => ids.Contains(p.Id) && p.Active)
            .ToListAsync(ct);
        foreach (var it in list)
        {
            var p = products.FirstOrDefault(x => x.Id == it.productId); if (p is null) continue;
            var oi = new OrderItem();
            oi.GetType().GetProperty(nameof(OrderItem.OrderId))!.SetValue(oi, o.Id);
            oi.GetType().GetProperty(nameof(OrderItem.ProductId))!.SetValue(oi, p.Id);
            oi.GetType().GetProperty(nameof(OrderItem.ProductName))!.SetValue(oi, $"{p.Brand.Name} {p.ModelName} {p.Size}");
            oi.GetType().GetProperty(nameof(OrderItem.ProductSku))!.SetValue(oi, p.Sku);
            oi.GetType().GetProperty(nameof(OrderItem.Size))!.SetValue(oi, p.Size);
            oi.GetType().GetProperty(nameof(OrderItem.UnitPrice))!.SetValue(oi, p.Price);
            oi.GetType().GetProperty(nameof(OrderItem.Quantity))!.SetValue(oi, Math.Max(1, it.qty));
            _db.OrderItems.Add(oi);
        }
        await _db.SaveChangesAsync(ct);
        await ApplyDiscountAndTotalsAsync(o, ct);
        await _db.SaveChangesAsync(ct);
        return (await GetAsync(o.Id, ct))!;
    }

    public async Task<AdminOrderDetailDto> SetItemQtyAsync(Guid id, Guid productId, int qty, CancellationToken ct = default)
    {
        var o = await _db.Orders.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new KeyNotFoundException();
        if (o.PaymentStatus == PaymentStatus.Succeeded) throw new InvalidOperationException("Order already paid");
        var it = await _db.OrderItems.FirstOrDefaultAsync(i => i.OrderId == id && i.ProductId == productId, ct);
        if (qty <= 0)
        {
            if (it is not null) _db.OrderItems.Remove(it);
        }
        else
        {
            if (it is null)
            {
                var p = await _db.Products.AsNoTracking().Include(x => x.Brand).FirstOrDefaultAsync(x => x.Id == productId && x.Active, ct) ?? throw new KeyNotFoundException("Product not found");
                var oi = new OrderItem();
                oi.GetType().GetProperty(nameof(OrderItem.OrderId))!.SetValue(oi, id);
                oi.GetType().GetProperty(nameof(OrderItem.ProductId))!.SetValue(oi, p.Id);
                oi.GetType().GetProperty(nameof(OrderItem.ProductName))!.SetValue(oi, $"{p.Brand.Name} {p.ModelName} {p.Size}");
                oi.GetType().GetProperty(nameof(OrderItem.ProductSku))!.SetValue(oi, p.Sku);
                oi.GetType().GetProperty(nameof(OrderItem.Size))!.SetValue(oi, p.Size);
                oi.GetType().GetProperty(nameof(OrderItem.UnitPrice))!.SetValue(oi, p.Price);
                oi.GetType().GetProperty(nameof(OrderItem.Quantity))!.SetValue(oi, Math.Max(1, qty));
                _db.OrderItems.Add(oi);
            }
            else
            {
                it.GetType().GetProperty(nameof(OrderItem.Quantity))!.SetValue(it, Math.Max(1, qty));
            }
        }
        await _db.SaveChangesAsync(ct);
        await ApplyDiscountAndTotalsAsync(o, ct);
        await _db.SaveChangesAsync(ct);
        return (await GetAsync(id, ct))!;
    }

    public async Task<AdminOrderDetailDto> RemoveItemAsync(Guid id, Guid productId, CancellationToken ct = default)
    {
        return await SetItemQtyAsync(id, productId, 0, ct);
    }

    public async Task<AdminOrderDetailDto> UpdateShippingAsync(Guid id, string line1, string? line2, string city, string state, string postalCode, string country, CancellationToken ct = default)
    {
        var o = await _db.Orders.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new KeyNotFoundException();
        o.GetType().GetProperty(nameof(Order.ShipLine1))!.SetValue(o, line1);
        o.GetType().GetProperty(nameof(Order.ShipLine2))!.SetValue(o, line2);
        o.GetType().GetProperty(nameof(Order.ShipCity))!.SetValue(o, city);
        o.GetType().GetProperty(nameof(Order.ShipState))!.SetValue(o, state);
        o.GetType().GetProperty(nameof(Order.ShipPostalCode))!.SetValue(o, postalCode);
        o.GetType().GetProperty(nameof(Order.ShipCountry))!.SetValue(o, string.IsNullOrWhiteSpace(country) ? "MX" : country);
        await _db.SaveChangesAsync(ct);
        return (await GetAsync(id, ct))!;
    }

    public async Task<AdminOrderDetailDto> SetDiscountAsync(Guid id, string? discountCode, CancellationToken ct = default)
    {
        var o = await _db.Orders.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new KeyNotFoundException();
        o.GetType().GetProperty(nameof(Order.DiscountCode))!.SetValue(o, string.IsNullOrWhiteSpace(discountCode) ? null : discountCode!.Trim());
        await ApplyDiscountAndTotalsAsync(o, ct);
        await _db.SaveChangesAsync(ct);
        return (await GetAsync(id, ct))!;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var o = await _db.Orders.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new KeyNotFoundException();
        if (o.PaymentStatus == PaymentStatus.Succeeded) throw new InvalidOperationException("Cannot delete a paid order");
        _db.OrderItems.RemoveRange(o.Items);
        _db.Orders.Remove(o);
        await _db.SaveChangesAsync(ct);
    }
}
