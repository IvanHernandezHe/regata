using Regata.Application.DTOs;

namespace Regata.Application.Interface;

public interface IDiscountsService
{
    Task<DiscountInfoDto?> ValidateAsync(string code, CancellationToken ct = default);
}

