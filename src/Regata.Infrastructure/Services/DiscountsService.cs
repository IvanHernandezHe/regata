using Microsoft.EntityFrameworkCore;
using Regata.Application.DTOs;
using Regata.Application.Interface;
using Regata.Infrastructure.Persistence;

namespace Regata.Infrastructure.Services;

public sealed class DiscountsService : IDiscountsService
{
    private readonly AppDbContext _db;
    public DiscountsService(AppDbContext db) { _db = db; }

    public async Task<DiscountInfoDto?> ValidateAsync(string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        var dc = await _db.DiscountCodes.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code && x.Active, ct);
        if (dc is null) return null;
        if (dc.ExpiresAtUtc.HasValue && dc.ExpiresAtUtc.Value <= DateTime.UtcNow) return null;
        if (dc.Redemptions >= dc.MaxRedemptions) return null;
        return new DiscountInfoDto(dc.Code, (int)dc.Type, dc.Value, dc.ExpiresAtUtc, dc.Redemptions, dc.MaxRedemptions);
    }
}

