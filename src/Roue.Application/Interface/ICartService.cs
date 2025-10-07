using Roue.Application.DTOs;

namespace Roue.Application.Interface;

public interface ICartService
{
    Task<CartDto> GetAsync(Guid? userId, Guid? cookieCartId, CancellationToken ct = default);
    Task<CartDto> MergeAsync(Guid userId, IEnumerable<(Guid productId, int qty)> items, Guid? cookieCartId, CancellationToken ct = default);
    Task<CartDto> AddAsync(Guid? userId, Guid? cookieCartId, Guid productId, int qty, CancellationToken ct = default);
    Task<CartDto> SetQtyAsync(Guid? userId, Guid? cookieCartId, Guid productId, int qty, CancellationToken ct = default);
    Task<CartDto> RemoveAsync(Guid? userId, Guid? cookieCartId, Guid productId, CancellationToken ct = default);
    Task<CartDto> ClearAsync(Guid? userId, Guid? cookieCartId, CancellationToken ct = default);
}

