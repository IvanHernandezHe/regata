using Roue.Application.DTOs;

namespace Roue.Application.Interface;

public interface IDiscountsService
{
    Task<DiscountInfoDto?> ValidateAsync(string code, CancellationToken ct = default);
}

