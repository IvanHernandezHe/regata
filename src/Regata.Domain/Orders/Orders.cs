namespace Regata.Domain.Orders;

public enum PaymentProvider { None=0, Stripe=1, MercadoPago=2 }
public enum PaymentStatus { Pending, Succeeded, Failed, Refunded }
public enum OrderStatus { Created, Paid, Preparing, Shipped, Completed, Cancelled }

public sealed class Order
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public List<OrderItem> Items { get; private set; } = new();
    public decimal Subtotal { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal Total { get; private set; }
    public string Currency { get; private set; } = "MXN";
    public PaymentProvider PaymentProvider { get; private set; }
    public PaymentStatus PaymentStatus { get; private set; } = PaymentStatus.Pending;
    public string? PaymentReference { get; private set; } // intentId (Stripe) / paymentId (MP)
    public OrderStatus Status { get; private set; } = OrderStatus.Created;
    public string? DiscountCode { get; private set; }
    public int PointsEarned { get; private set; }
    public int PointsSpent { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
}

public sealed class OrderItem
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = default!;
    public string ProductSku { get; private set; } = default!;
    public string Size { get; private set; } = default!;
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public decimal LineTotal => UnitPrice * Quantity;
}