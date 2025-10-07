namespace Roue.Domain.Carts;

public sealed class Cart
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid? UserId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; private set; } = DateTime.UtcNow;
    public List<CartItem> Items { get; private set; } = new();

    public Cart() {}
    public void AttachToUser(Guid userId) => UserId = userId;
    public void Touch() => UpdatedAtUtc = DateTime.UtcNow;
}

public sealed class CartItem
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid CartId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public string ProductName { get; private set; } = default!;
    public string ProductSku { get; private set; } = default!;
    public string Size { get; private set; } = default!;

    public CartItem() {}

    public CartItem(Guid cartId, Guid productId, string name, string sku, string size, decimal unitPrice, int qty)
    {
        CartId = cartId; ProductId = productId; ProductName = name; ProductSku = sku; Size = size; UnitPrice = unitPrice; Quantity = qty;
    }

    public void Add(int by) { Quantity += by; if (Quantity < 1) Quantity = 1; }
    public void SetQty(int qty) { Quantity = Math.Max(1, qty); }
}
