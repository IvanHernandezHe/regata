using Roue.Application.Interface;
using Microsoft.Extensions.Configuration;

namespace Roue.Infrastructure.Services;

public sealed class DefaultShippingCalculator : IShippingCalculator
{
    private readonly IConfiguration _cfg;
    public DefaultShippingCalculator(IConfiguration cfg) { _cfg = cfg; }
    public Task<decimal> CalculateAsync(decimal subtotal, CancellationToken ct = default)
    {
        var freeOver = decimal.TryParse(_cfg["Shipping:FreeOver"], out var f) ? f : 5000m;
        var flat = decimal.TryParse(_cfg["Shipping:FlatRate"], out var r) ? r : 99m;
        var ship = subtotal >= freeOver ? 0m : flat;
        return Task.FromResult(ship);
    }
}
