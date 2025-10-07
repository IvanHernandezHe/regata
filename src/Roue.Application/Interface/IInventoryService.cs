using Roue.Domain.Orders;

namespace Roue.Application.Interface;

public interface IInventoryService
{
    Task<(bool ok, string token, DateTime expiresAtUtc, string? error)> ReserveAsync(IEnumerable<(Guid productId, int qty)> lines, TimeSpan ttl, string reference, CancellationToken ct = default);
    Task ReleaseAsync(string token, CancellationToken ct = default);
    Task<bool> CommitOnPaymentAsync(Order order, string? reservationToken = null, CancellationToken ct = default);
}
