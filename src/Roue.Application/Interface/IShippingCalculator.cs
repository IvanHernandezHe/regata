namespace Roue.Application.Interface;

public interface IShippingCalculator
{
    Task<decimal> CalculateAsync(decimal subtotal, CancellationToken ct = default);
}

