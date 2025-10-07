namespace Roue.Application.DTOs;

public sealed record OrderSummaryDto(
    Guid Id,
    decimal Total,
    string Status,
    DateTime CreatedAtUtc,
    ShippingSnapshotDto Shipping
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
    IReadOnlyList<OrderItemLineDto> Items,
    ShippingSnapshotDto Shipping
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

public sealed record ShippingSnapshotDto(
    string? Line1,
    string? Line2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country,
    string? TrackingCarrier,
    string? TrackingCode,
    DateTime? ShippedAtUtc
);
