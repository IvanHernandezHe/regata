using Roue.Application.DTOs;

namespace Roue.Application.Interface;

public interface IOrdersService
{
    Task<IReadOnlyList<OrderSummaryDto>> GetMineAsync(Guid userId, int take = 20, CancellationToken ct = default);
    Task<OrderDetailDto?> GetByIdAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<QuoteResponseDto> QuoteAsync(IReadOnlyList<CheckoutLineDto> items, string? discountCode, CancellationToken ct = default);
    Task<CheckoutResponseDto> CheckoutAsync(Guid userId, IReadOnlyList<CheckoutLineDto> items, string? discountCode, Guid? addressId, string? reservationToken, CancellationToken ct = default);
    Task<ReserveResponseDto> ReserveAsync(IReadOnlyList<CheckoutLineDto> items, int ttlSeconds, CancellationToken ct = default);
    Task ReleaseAsync(string token, CancellationToken ct = default);
    Task<bool> MarkPaidSandboxAsync(Guid userId, Guid orderId, CancellationToken ct = default);
    Task<bool> CancelAsync(Guid userId, Guid orderId, CancellationToken ct = default);
}
