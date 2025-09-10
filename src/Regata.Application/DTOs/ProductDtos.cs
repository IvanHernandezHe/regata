namespace Regata.Application.DTOs;

public sealed record ProductListItemDto(
    Guid Id,
    string Sku,
    string Brand,
    string ModelName,
    string Size,
    decimal Price,
    bool Active,
    int Stock
);

public sealed record ProductDetailDto(
    Guid Id,
    string Sku,
    string Brand,
    string ModelName,
    string Size,
    decimal Price,
    bool Active,
    int Stock
);

