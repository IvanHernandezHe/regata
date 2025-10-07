namespace Roue.Domain.Orders;

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
    // Shipping snapshot (MVP)
    public string? ShipLine1 { get; private set; }
    public string? ShipLine2 { get; private set; }
    public string? ShipCity { get; private set; }
    public string? ShipState { get; private set; }
    public string? ShipPostalCode { get; private set; }
    public string? ShipCountry { get; private set; }
    public decimal ShippingCost { get; private set; }
    // Shipment tracking (MVP)
    public string? ShipTrackingCarrier { get; private set; }
    public string? ShipTrackingCode { get; private set; }
    public DateTime? ShippedAtUtc { get; private set; }

    // Domain behaviors
    public void Initialize(Guid userId, decimal subtotal, decimal discountAmount, decimal shippingCost, decimal total, string currency, string? discountCode = null)
    {
        if (userId == Guid.Empty) throw new ArgumentException("userId");
        if (subtotal < 0 || discountAmount < 0 || shippingCost < 0 || total < 0) throw new ArgumentException("Amounts must be positive");
        UserId = userId;
        Subtotal = subtotal;
        DiscountAmount = discountAmount;
        ShippingCost = shippingCost;
        Total = total;
        Currency = string.IsNullOrWhiteSpace(currency) ? "MXN" : currency;
        if (!string.IsNullOrWhiteSpace(discountCode)) DiscountCode = discountCode;
        PaymentProvider = PaymentProvider.None;
        PaymentStatus = PaymentStatus.Pending;
        Status = OrderStatus.Created;
    }

    public void SetShippingAddress(string line1, string? line2, string city, string state, string postalCode, string country)
    {
        ShipLine1 = line1; ShipLine2 = line2; ShipCity = city; ShipState = state; ShipPostalCode = postalCode; ShipCountry = country;
    }

    public void SetShipmentTracking(string? carrier, string? trackingCode, DateTime? shippedAtUtc)
    {
        ShipTrackingCarrier = string.IsNullOrWhiteSpace(carrier) ? null : carrier;
        ShipTrackingCode = string.IsNullOrWhiteSpace(trackingCode) ? null : trackingCode;
        ShippedAtUtc = shippedAtUtc;
    }

    public void AddItem(Guid productId, string productName, string sku, string size, decimal unitPrice, int quantity)
    {
        if (productId == Guid.Empty) throw new ArgumentException("productId");
        if (quantity < 1) throw new ArgumentException("quantity");
        Items.Add(new OrderItem(Id, productId, productName, sku, size, unitPrice, quantity));
    }

    public void SetPaymentReference(string reference) { PaymentReference = reference; }
    public void SetStatus(OrderStatus status) { Status = status; }
    public void SetPaymentStatus(PaymentStatus status) { PaymentStatus = status; }
    public void MarkPaid()
    {
        PaymentStatus = PaymentStatus.Succeeded;
        Status = OrderStatus.Paid;
    }
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

    public OrderItem() { }
    public OrderItem(Guid orderId, Guid productId, string productName, string productSku, string size, decimal unitPrice, int quantity)
    {
        OrderId = orderId; ProductId = productId; ProductName = productName; ProductSku = productSku; Size = size; UnitPrice = unitPrice; Quantity = quantity;
    }
}
