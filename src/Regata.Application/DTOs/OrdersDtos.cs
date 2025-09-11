namespace Regata.Application.DTOs;

public sealed record OrderSummaryDto(
    Guid Id,
    decimal Total,
    string Status,
    DateTime CreatedAtUtc
);

public sealed record OrderItemLineDto(
    Guid ProductId,
    string ProductName,
    string ProductSku,
    string Size,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal
);

public sealed record OrderDetailDto(
    Guid Id,
    decimal Total,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal ShippingCost,
    string Currency,
    string Status,
    string PaymentStatus,
    string PaymentProvider,
    string? PaymentReference,
    DateTime CreatedAtUtc,
    IReadOnlyList<OrderItemLineDto> Items
);

public sealed record CheckoutLineDto(Guid ProductId, int Quantity);

public sealed record QuoteResponseDto(
    decimal Subtotal,
    decimal Discount,
    decimal Shipping,
    decimal Total,
    string Currency,
    IReadOnlyList<OrderItemLineDto> Items
);

public sealed record CheckoutResponseDto(
    Guid OrderId,
    decimal Subtotal,
    decimal Discount,
    decimal Shipping,
    decimal Total,
    string Currency
);

public sealed record ReserveResponseDto(string Token, DateTime ExpiresAtUtc);
