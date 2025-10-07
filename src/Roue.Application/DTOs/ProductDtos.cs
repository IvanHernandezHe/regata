namespace Roue.Application.DTOs;

public sealed record ProductListItemDto(
    Guid Id,
    string Sku,
    string Brand,
    string ModelName,
    string Size,
    decimal Price,
    bool Active,
    int Stock,
    string? Category
);

public sealed record ProductDetailDto(
    Guid Id,
    string Sku,
    string Brand,
    string ModelName,
    string Size,
    decimal Price,
    bool Active,
    int Stock,
    string? BrandLogoUrl,
    IReadOnlyList<string> Images,
    TireSpecsDto? Tire,
    RimSpecsDto? Rim,
    string? Category
);

public sealed record TireSpecsDto(string? Type, string? LoadIndex, string? SpeedRating);
public sealed record RimSpecsDto(double? DiameterIn, double? WidthIn, string? BoltPattern, int? OffsetMm, double? CenterBoreMm, string? Material, string? Finish);
