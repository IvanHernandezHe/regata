using Roue.Application.DTOs;

namespace Roue.Application.Interface;

public interface IAddressService
{
    Task<IReadOnlyList<AddressDto>> ListAsync(Guid userId, CancellationToken ct = default);
    Task<Guid> CreateAsync(Guid userId, UpsertAddressDto input, CancellationToken ct = default);
    Task UpdateAsync(Guid userId, Guid id, UpsertAddressDto input, CancellationToken ct = default);
    Task SetDefaultAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, Guid id, CancellationToken ct = default);
}

