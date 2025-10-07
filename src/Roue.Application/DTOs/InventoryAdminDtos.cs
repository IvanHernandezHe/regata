namespace Roue.Application.DTOs;

public sealed record InventoryRowDto(Guid Id, string Sku, string Brand, string ModelName, string Size, int OnHand, int Reserved, int Version);
public sealed record InventoryTxnDto(Guid Id, Guid ProductId, int Quantity, string Type, string? Reference, DateTime CreatedAtUtc);

