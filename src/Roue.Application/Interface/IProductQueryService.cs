using Roue.Application.DTOs;

namespace Roue.Application.Interface;

public interface IProductQueryService
{
    Task<IReadOnlyList<ProductListItemDto>> SearchAsync(string? q, string? category = null, int take = 50, CancellationToken ct = default);
    Task<ProductDetailDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
}
