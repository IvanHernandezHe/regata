using Microsoft.EntityFrameworkCore;
using Roue.Application.DTOs;
using Roue.Application.Interface;
using Roue.Domain.Marketing;
using Roue.Domain.Orders;
using Roue.Infrastructure.Persistence;

namespace Roue.Infrastructure.Services;

public sealed class OrdersService : IOrdersService
{
    private readonly AppDbContext _db;
    private readonly IInventoryService _inventory;
    private readonly IShippingCalculator _shipping;
    public OrdersService(AppDbContext db, IInventoryService inventory, IShippingCalculator shipping)
    { _db = db; _inventory = inventory; _shipping = shipping; }

    public async Task<IReadOnlyList<OrderSummaryDto>> GetMineAsync(Guid userId, int take = 20, CancellationToken ct = default)
    {
        var list = await _db.Orders.AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Take(take)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.Total,
                o.Status.ToString(),
                o.CreatedAtUtc,
                new ShippingSnapshotDto(
                    o.ShipLine1,
                    o.ShipLine2,
                    o.ShipCity,
                    o.ShipState,
                    o.ShipPostalCode,
                    o.ShipCountry,
                    o.ShipTrackingCarrier,
                    o.ShipTrackingCode,
                    o.ShippedAtUtc)))
            .ToListAsync(ct);
        return list;
    }

    public async Task<OrderDetailDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var order = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId, ct);
        if (order is null) return null;
        var items = await _db.OrderItems.AsNoTracking()
            .Where(i => i.OrderId == id)
            .Select(i => new OrderItemLineDto(i.ProductId, i.ProductName, i.ProductSku, i.Size, i.UnitPrice, i.Quantity, i.UnitPrice * i.Quantity))
            .ToListAsync(ct);
        var shipping = new ShippingSnapshotDto(
            order.ShipLine1,
            order.ShipLine2,
            order.ShipCity,
            order.ShipState,
            order.ShipPostalCode,
            order.ShipCountry,
            order.ShipTrackingCarrier,
            order.ShipTrackingCode,
            order.ShippedAtUtc);
        return new OrderDetailDto(order.Id, order.Total, order.Subtotal, order.DiscountAmount, order.ShippingCost, order.Currency, order.Status.ToString(), order.PaymentStatus.ToString(), order.PaymentProvider.ToString(), order.PaymentReference, order.CreatedAtUtc, items, shipping);
    }

    public async Task<QuoteResponseDto> QuoteAsync(IReadOnlyList<CheckoutLineDto> items, string? discountCode, CancellationToken ct = default)
    {
        if (items is null || items.Count == 0) throw new ArgumentException("No items");
        var normalized = items.GroupBy(i => i.ProductId).Select(g => new { ProductId = g.Key, Quantity = Math.Max(1, g.Sum(x => x.Quantity)) }).ToList();
        var ids = normalized.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products.AsNoTracking()
            .Include(p => p.Brand)
            .Where(p => ids.Contains(p.Id) && p.Active)
            .ToListAsync(ct);
        var lines = new List<OrderItemLineDto>();
        foreach (var it in normalized)
        {
            var p = products.FirstOrDefault(x => x.Id == it.ProductId); if (p is null) continue;
            lines.Add(new OrderItemLineDto(p.Id, $"{p.Brand.Name} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price, it.Quantity, p.Price * it.Quantity));
        }
        if (lines.Count == 0) throw new InvalidOperationException("No valid products");
        var subtotal = lines.Sum(l => l.LineTotal);
        decimal discount = 0m;
        if (!string.IsNullOrWhiteSpace(discountCode))
        {
            var code = discountCode.Trim();
            var dc = await _db.DiscountCodes.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code && x.Active && (!x.ExpiresAtUtc.HasValue || x.ExpiresAtUtc > DateTime.UtcNow) && x.Redemptions < x.MaxRedemptions, ct);
            if (dc is not null)
            {
                if (dc.Type == DiscountType.Percentage) discount = Math.Round(subtotal * (dc.Value / 100m), 2, MidpointRounding.AwayFromZero);
                else if (dc.Type == DiscountType.FixedAmount) discount = Math.Max(0m, Math.Min(subtotal, dc.Value));
            }
        }
        decimal shipping = await _shipping.CalculateAsync(subtotal, ct);
        var total = Math.Max(0m, subtotal - discount + shipping);
        return new QuoteResponseDto(subtotal, discount, shipping, total, "MXN", lines);
    }

    public async Task<CheckoutResponseDto> CheckoutAsync(Guid userId, IReadOnlyList<CheckoutLineDto> items, string? discountCode, Guid? addressId, string? reservationToken, CancellationToken ct = default)
    {
        var quote = await QuoteAsync(items, discountCode, ct);
        var order = new Order();
        order.GetType().GetProperty(nameof(Order.UserId))!.SetValue(order, userId);
        order.GetType().GetProperty(nameof(Order.Subtotal))!.SetValue(order, quote.Subtotal);
        order.GetType().GetProperty(nameof(Order.DiscountAmount))!.SetValue(order, quote.Discount);
        order.GetType().GetProperty(nameof(Order.ShippingCost))!.SetValue(order, quote.Shipping);
        order.GetType().GetProperty(nameof(Order.Total))!.SetValue(order, quote.Total);
        order.GetType().GetProperty(nameof(Order.Currency))!.SetValue(order, quote.Currency);
        if (!string.IsNullOrWhiteSpace(discountCode)) order.GetType().GetProperty(nameof(Order.DiscountCode))!.SetValue(order, discountCode);

        if (addressId.HasValue)
        {
            var addr = await _db.Addresses.AsNoTracking().FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId, ct);
            if (addr is null) throw new InvalidOperationException("Invalid address");
            order.GetType().GetProperty(nameof(Order.ShipLine1))!.SetValue(order, addr.Line1);
            order.GetType().GetProperty(nameof(Order.ShipLine2))!.SetValue(order, addr.Line2);
            order.GetType().GetProperty(nameof(Order.ShipCity))!.SetValue(order, addr.City);
            order.GetType().GetProperty(nameof(Order.ShipState))!.SetValue(order, addr.State);
            order.GetType().GetProperty(nameof(Order.ShipPostalCode))!.SetValue(order, addr.PostalCode);
            order.GetType().GetProperty(nameof(Order.ShipCountry))!.SetValue(order, addr.Country);
        }

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        var normalized = items.GroupBy(i => i.ProductId).Select(g => new { ProductId = g.Key, Quantity = Math.Max(1, g.Sum(x => x.Quantity)) }).ToList();
        var ids = normalized.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products.AsNoTracking()
            .Include(p => p.Brand)
            .Where(p => ids.Contains(p.Id) && p.Active)
            .ToListAsync(ct);
        foreach (var it in normalized)
        {
            var p = products.FirstOrDefault(x => x.Id == it.ProductId); if (p is null) continue;
            var oi = new Roue.Domain.Orders.OrderItem();
            oi.GetType().GetProperty(nameof(Roue.Domain.Orders.OrderItem.OrderId))!.SetValue(oi, order.Id);
            oi.GetType().GetProperty(nameof(Roue.Domain.Orders.OrderItem.ProductId))!.SetValue(oi, p.Id);
            oi.GetType().GetProperty(nameof(Roue.Domain.Orders.OrderItem.ProductName))!.SetValue(oi, $"{p.Brand.Name} {p.ModelName} {p.Size}");
            oi.GetType().GetProperty(nameof(Roue.Domain.Orders.OrderItem.ProductSku))!.SetValue(oi, p.Sku);
            oi.GetType().GetProperty(nameof(Roue.Domain.Orders.OrderItem.Size))!.SetValue(oi, p.Size);
            oi.GetType().GetProperty(nameof(Roue.Domain.Orders.OrderItem.UnitPrice))!.SetValue(oi, p.Price);
            oi.GetType().GetProperty(nameof(Roue.Domain.Orders.OrderItem.Quantity))!.SetValue(oi, it.Quantity);
            _db.OrderItems.Add(oi);
        }
        if (!string.IsNullOrWhiteSpace(reservationToken)) order.GetType().GetProperty(nameof(Order.PaymentReference))!.SetValue(order, $"resv:{reservationToken}");
        await _db.SaveChangesAsync(ct);
        return new CheckoutResponseDto(order.Id, quote.Subtotal, quote.Discount, quote.Shipping, quote.Total, quote.Currency);
    }

    public async Task<ReserveResponseDto> ReserveAsync(IReadOnlyList<CheckoutLineDto> items, int ttlSeconds, CancellationToken ct = default)
    {
        var ttl = TimeSpan.FromSeconds(Math.Clamp(ttlSeconds, 60, 3600));
        var lines = items.Select(i => (i.ProductId, Math.Max(1, i.Quantity)));
        var (ok, token, expiresAt, error) = await _inventory.ReserveAsync(lines, ttl, reference: "checkout", ct);
        if (!ok) throw new InvalidOperationException(error ?? "no disponible");
        return new ReserveResponseDto(token, expiresAt);
    }

    public Task ReleaseAsync(string token, CancellationToken ct = default)
        => _inventory.ReleaseAsync(token, ct);

    public Task<bool> MarkPaidSandboxAsync(Guid userId, Guid orderId, CancellationToken ct = default)
    {
        return MarkPaidSandboxInternalAsync(userId, orderId, ct);
    }

    private async Task<bool> MarkPaidSandboxInternalAsync(Guid userId, Guid orderId, CancellationToken ct)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct);
        if (order is null) throw new KeyNotFoundException();
        if (order.UserId != userId) throw new UnauthorizedAccessException();

        if (order.PaymentStatus == PaymentStatus.Succeeded)
            return true; // already paid

        string? reservationToken = null;
        if (!string.IsNullOrWhiteSpace(order.PaymentReference) && order.PaymentReference!.StartsWith("resv:", StringComparison.OrdinalIgnoreCase))
            reservationToken = order.PaymentReference!.Substring(5);

        var committed = await _inventory.CommitOnPaymentAsync(order, reservationToken, ct);
        if (!committed) return false; // not enough inventory

        order.MarkPaid();
        // Increment discount redemptions if applicable
        if (!string.IsNullOrWhiteSpace(order.DiscountCode))
        {
            var dc = await _db.DiscountCodes.FirstOrDefaultAsync(x => x.Code == order.DiscountCode, ct);
            if (dc is not null)
            {
                var prop = typeof(Roue.Domain.Marketing.DiscountCode).GetProperty(nameof(Roue.Domain.Marketing.DiscountCode.Redemptions))!;
                var curr = (int)(prop.GetValue(dc) ?? 0);
                prop.SetValue(dc, curr + 1);
            }
        }
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> CancelAsync(Guid userId, Guid orderId, CancellationToken ct = default)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct);
        if (order is null) throw new KeyNotFoundException();
        if (order.UserId != userId) throw new UnauthorizedAccessException();
        if (order.PaymentStatus == PaymentStatus.Succeeded) return false; // cannot cancel paid orders

        // Release any existing reservation
        if (!string.IsNullOrWhiteSpace(order.PaymentReference) && order.PaymentReference!.StartsWith("resv:", StringComparison.OrdinalIgnoreCase))
        {
            var token = order.PaymentReference!.Substring(5);
            try { await _inventory.ReleaseAsync(token, ct); } catch { }
        }

        order.GetType().GetProperty(nameof(Order.Status))!.SetValue(order, OrderStatus.Cancelled);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
