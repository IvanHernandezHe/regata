namespace Roue.Application.DTOs;

public sealed record CartItemDto(
    Guid ProductId,
    string Name,
    string Sku,
    string Size,
    decimal Price,
    int Qty,
    int? Stock
);

public sealed record CartDto(
    Guid Id,
    Guid? UserId,
    IReadOnlyList<CartItemDto> Items,
    decimal Subtotal
);

