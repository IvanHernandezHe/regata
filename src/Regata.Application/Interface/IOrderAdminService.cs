using Regata.Application.DTOs;
using Regata.Domain.Orders;

namespace Regata.Application.Interface;

public interface IOrderAdminService
{
    Task<(long total, IReadOnlyList<AdminOrderSummaryDto> items)> ListAsync(OrderStatus? status, PaymentStatus? paymentStatus, int page, int pageSize, CancellationToken ct = default);
    Task<AdminOrderDetailDto?> GetAsync(Guid id, CancellationToken ct = default);
    Task SetStatusAsync(Guid id, OrderStatus status, CancellationToken ct = default);
    Task SetPaymentStatusAsync(Guid id, PaymentStatus paymentStatus, CancellationToken ct = default);
}

