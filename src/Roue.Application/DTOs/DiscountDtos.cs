namespace Roue.Application.DTOs;

public sealed record DiscountInfoDto(
    string Code,
    int Type,
    decimal Value,
    DateTime? ExpiresAtUtc,
    int Redemptions,
    int MaxRedemptions
);

