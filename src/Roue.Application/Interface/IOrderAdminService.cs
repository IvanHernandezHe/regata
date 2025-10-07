using Roue.Application.DTOs;
using Roue.Domain.Orders;

namespace Roue.Application.Interface;

public interface IOrderAdminService
{
    Task<(long total, IReadOnlyList<AdminOrderSummaryDto> items)> ListAsync(OrderStatus? status, PaymentStatus? paymentStatus, int page, int pageSize, CancellationToken ct = default);
    Task<AdminOrderDetailDto?> GetAsync(Guid id, CancellationToken ct = default);
    Task SetStatusAsync(Guid id, OrderStatus status, CancellationToken ct = default);
    Task SetPaymentStatusAsync(Guid id, PaymentStatus paymentStatus, CancellationToken ct = default);
    Task SetShipmentAsync(Guid id, string? carrier, string? trackingCode, DateTime? shippedAtUtc, CancellationToken ct = default);
    Task<AdminOrderDetailDto> CreateAsync(Guid userId, IEnumerable<(Guid productId, int qty)> items, string? discountCode, CancellationToken ct = default);
    Task<AdminOrderDetailDto> SetItemQtyAsync(Guid id, Guid productId, int qty, CancellationToken ct = default);
    Task<AdminOrderDetailDto> RemoveItemAsync(Guid id, Guid productId, CancellationToken ct = default);
    Task<AdminOrderDetailDto> UpdateShippingAsync(Guid id, string line1, string? line2, string city, string state, string postalCode, string country, CancellationToken ct = default);
    Task<AdminOrderDetailDto> SetDiscountAsync(Guid id, string? discountCode, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
