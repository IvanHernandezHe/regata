namespace Regata.Domain.Products;

public sealed class Product
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Sku { get; private set; } = default!;
    public string Brand { get; private set; } = default!; // legacy name kept for compatibility
    public Guid? BrandId { get; private set; }
    public Guid? CategoryId { get; private set; }
    public string ModelName { get; private set; } = default!;
    public string Size { get; private set; } = default!; // 205/55R16
    public decimal Price { get; private set; }
    public bool Active { get; private set; } = true;
    // Optional marketing/spec fields
    public string? Type { get; private set; } // e.g., CAMIONETA, AUTO
    public string? LoadIndex { get; private set; } // e.g., 107(975Kg.)
    public string? SpeedRating { get; private set; } // e.g., H (210Km/hr)
    // JSON array of image URLs (client parses)
    public string? ImagesJson { get; private set; }

    public Product(string sku, string brand, string model, string size, decimal price)
    {
        Sku = sku; Brand = brand; ModelName = model; Size = size; Price = price;
    }

    private Product() { }
}
