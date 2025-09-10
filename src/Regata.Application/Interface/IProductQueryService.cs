using Regata.Application.DTOs;

namespace Regata.Application.Interface;

public interface IProductQueryService
{
    Task<IReadOnlyList<ProductListItemDto>> SearchAsync(string? q, int take = 50, CancellationToken ct = default);
    Task<ProductDetailDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
}

