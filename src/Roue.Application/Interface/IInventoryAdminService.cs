using Roue.Application.DTOs;

namespace Roue.Application.Interface;

public interface IInventoryAdminService
{
    Task<IReadOnlyList<InventoryRowDto>> ListAsync(Guid? productId, CancellationToken ct = default);
    Task<PagedResultDto<InventoryTxnDto>> TransactionsAsync(Guid? productId, DateTime? from, DateTime? to, int page, int pageSize, CancellationToken ct = default);
    Task AdjustAsync(Guid productId, int delta, string? reason, CancellationToken ct = default);
}

