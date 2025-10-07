namespace Roue.Domain.Inventory;

public enum ReservationStatus { Active=0, Released=1, Committed=2, Expired=3 }

public sealed class InventoryReservation
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Token { get; private set; } = Guid.NewGuid().ToString("n");
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public ReservationStatus Status { get; private set; } = ReservationStatus.Active;
    public string Reference { get; private set; } = string.Empty; // e.g., cart/session/order
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    public InventoryReservation() { }
    public InventoryReservation(Guid productId, int qty, DateTime expiresAtUtc, string reference, string? token = null)
    { ProductId = productId; Quantity = qty; ExpiresAtUtc = expiresAtUtc; Reference = reference; if (!string.IsNullOrWhiteSpace(token)) Token = token!; }

    public bool IsActive(DateTime now) => Status == ReservationStatus.Active && now < ExpiresAtUtc;
    public void Release() => Status = ReservationStatus.Released;
    public void Commit() => Status = ReservationStatus.Committed;
    public void Expire() => Status = ReservationStatus.Expired;
}
