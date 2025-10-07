using Roue.Domain.Orders;

namespace Roue.Application.DTOs;

public sealed record AdminOrderSummaryDto(
    Guid Id,
    string? UserEmail,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal ShippingCost,
    decimal Total,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    DateTime CreatedAtUtc
);

public sealed record AdminOrderItemDto(
    Guid ProductId,
    string ProductName,
    string ProductSku,
    string Size,
    decimal UnitPrice,
    int Quantity
);

public sealed record ShipDto(
    string? ShipLine1,
    string? ShipLine2,
    string? ShipCity,
    string? ShipState,
    string? ShipPostalCode,
    string? ShipCountry,
    string? TrackingCarrier,
    string? TrackingCode,
    DateTime? ShippedAtUtc
);

public sealed record AdminOrderDetailDto(
    Guid Id,
    string? UserEmail,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal ShippingCost,
    decimal Total,
    string Currency,
    OrderStatus Status,
    PaymentStatus PaymentStatus,
    PaymentProvider PaymentProvider,
    string? PaymentReference,
    DateTime CreatedAtUtc,
    ShipDto? Ship,
    IReadOnlyList<AdminOrderItemDto> Items
);
