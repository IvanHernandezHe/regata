using Microsoft.EntityFrameworkCore;
using Regata.Application.DTOs;
using Regata.Application.Interface;
using Regata.Domain.Marketing;
using Regata.Domain.Orders;
using Regata.Infrastructure.Persistence;
using FluentValidation;
using Regata.Application.Validation;

namespace Regata.Infrastructure.Services;

public sealed class OrdersService : IOrdersService
{
    private readonly AppDbContext _db;
    private readonly IInventoryService _inventory;
    public OrdersService(AppDbContext db, IInventoryService inventory)
    { _db = db; _inventory = inventory; }

    public async Task<IReadOnlyList<OrderSummaryDto>> GetMineAsync(Guid userId, int take = 20, CancellationToken ct = default)
    {
        var list = await _db.Orders.AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Take(take)
            .Select(o => new OrderSummaryDto(o.Id, o.Total, o.Status.ToString(), o.CreatedAtUtc))
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
        return new OrderDetailDto(order.Id, order.Total, order.Subtotal, order.DiscountAmount, order.Currency, order.Status.ToString(), order.PaymentStatus.ToString(), order.PaymentProvider.ToString(), order.CreatedAtUtc, items);
    }

    public async Task<QuoteResponseDto> QuoteAsync(IReadOnlyList<CheckoutLineDto> items, string? discountCode, CancellationToken ct = default)
    {
        new CheckoutLinesValidator().ValidateAndThrow(items);
        var normalized = items.GroupBy(i => i.ProductId).Select(g => new { ProductId = g.Key, Quantity = Math.Max(1, g.Sum(x => x.Quantity)) }).ToList();
        var ids = normalized.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products.AsNoTracking().Where(p => ids.Contains(p.Id) && p.Active).ToListAsync(ct);
        var lines = new List<OrderItemLineDto>();
        foreach (var it in normalized)
        {
            var p = products.FirstOrDefault(x => x.Id == it.ProductId); if (p is null) continue;
            lines.Add(new OrderItemLineDto(p.Id, $"{p.Brand} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price, it.Quantity, p.Price * it.Quantity));
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
        decimal shipping = subtotal >= 5000m ? 0m : 99m;
        var total = Math.Max(0m, subtotal - discount + shipping);
        return new QuoteResponseDto(subtotal, discount, shipping, total, "MXN", lines);
    }

    public async Task<CheckoutResponseDto> CheckoutAsync(Guid userId, IReadOnlyList<CheckoutLineDto> items, string? discountCode, Guid? addressId, string? reservationToken, CancellationToken ct = default)
    {
        new CheckoutLinesValidator().ValidateAndThrow(items);
        var quote = await QuoteAsync(items, discountCode, ct);
        var order = new Order();
        order.Initialize(userId, quote.Subtotal, quote.Discount, quote.Shipping, quote.Total, quote.Currency, discountCode);

        if (addressId.HasValue)
        {
            var addr = await _db.Addresses.AsNoTracking().FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId, ct);
            if (addr is null) throw new InvalidOperationException("Invalid address");
            order.SetShippingAddress(addr.Line1, addr.Line2, addr.City, addr.State, addr.PostalCode, addr.Country);
        }
        var normalized = items.GroupBy(i => i.ProductId).Select(g => new { ProductId = g.Key, Quantity = Math.Max(1, g.Sum(x => x.Quantity)) }).ToList();
        var ids = normalized.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products.AsNoTracking().Where(p => ids.Contains(p.Id) && p.Active).ToListAsync(ct);
        foreach (var it in normalized)
        {
            var p = products.FirstOrDefault(x => x.Id == it.ProductId); if (p is null) continue;
            order.AddItem(p.Id, $"{p.Brand} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price, it.Quantity);
        }
        if (!string.IsNullOrWhiteSpace(reservationToken)) order.SetPaymentReference($"resv:{reservationToken}");
        _db.Orders.Add(order);
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

    public async Task<bool> MarkPaidSandboxAsync(Guid userId, Guid orderId, CancellationToken ct = default)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct);
        if (order is null) throw new KeyNotFoundException();
        if (order.UserId != userId) throw new UnauthorizedAccessException();
        order.MarkPaid();
        await _db.SaveChangesAsync(ct);
        var token = (order.PaymentReference != null && order.PaymentReference.StartsWith("resv:")) ? order.PaymentReference.Substring(5) : null;
        var ok = await _inventory.CommitOnPaymentAsync(order, token, ct);
        return ok;
    }
}
