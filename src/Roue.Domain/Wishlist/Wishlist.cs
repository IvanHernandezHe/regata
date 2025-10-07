namespace Roue.Domain.Wishlist;

public sealed class WishlistItem
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = default!;
    public string ProductSku { get; private set; } = default!;
    public string Size { get; private set; } = default!;
    public decimal Price { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    public WishlistItem() { }
    public WishlistItem(Guid userId, Guid productId, string name, string sku, string size, decimal price)
    { UserId = userId; ProductId = productId; ProductName = name; ProductSku = sku; Size = size; Price = price; }
}

