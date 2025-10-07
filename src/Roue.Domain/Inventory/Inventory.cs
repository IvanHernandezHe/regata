namespace Roue.Domain.Inventory;

public enum InventoryTxnType { Adjust=0, Consume=1, Receive=2, Return=3 }

public sealed class InventoryItem
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid ProductId { get; private set; }
    public int OnHand { get; private set; }
    public int Reserved { get; private set; }
    public int Version { get; private set; } // concurrency token

    public InventoryItem() { }
    public InventoryItem(Guid productId, int onHand)
    { ProductId = productId; OnHand = onHand; }

    public bool CanConsume(int qty) => qty > 0 && OnHand >= qty;
    public void Consume(int qty) { if (qty < 0) qty = 0; OnHand -= qty; if (OnHand < 0) OnHand = 0; Version++; }
    public void Adjust(int delta) { OnHand += delta; if (OnHand < 0) OnHand = 0; Version++; }
}

public sealed class InventoryTransaction
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; } // positive for receive/return; negative for consume
    public InventoryTxnType Type { get; private set; }
    public string Reference { get; private set; } = default!; // e.g., OrderId
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    public InventoryTransaction() { }
    public InventoryTransaction(Guid productId, int quantity, InventoryTxnType type, string reference)
    { ProductId = productId; Quantity = quantity; Type = type; Reference = reference; }
}

