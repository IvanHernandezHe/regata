namespace Roue.Domain.Products;

public sealed class Product
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Sku { get; private set; } = default!;
    public Guid BrandId { get; private set; }
    public Brand Brand { get; private set; } = default!;
    public Guid? CategoryId { get; private set; }
    public ProductCategory? Category { get; private set; }
    public string ModelName { get; private set; } = default!;
    public string Size { get; private set; } = default!; // 205/55R16
    public decimal Price { get; private set; }
    public bool Active { get; private set; } = true;
    // JSON array of image URLs (client parses)
    public string? ImagesJson { get; private set; }
    public TireSpecs? Tire { get; private set; }
    public RimSpecs? Rim { get; private set; }

    public Product(string sku, Guid brandId, string model, string size, decimal price, Guid? categoryId = null)
    { Sku = sku; BrandId = brandId; ModelName = model; Size = size; Price = price; CategoryId = categoryId; }

    private Product() { }
}
