namespace Regata.Domain.Products;

public sealed class Product
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Sku { get; private set; } = default!;
    public string Brand { get; private set; } = default!;
    public string ModelName { get; private set; } = default!;
    public string Size { get; private set; } = default!; // 205/55R16
    public decimal Price { get; private set; }
    public bool Active { get; private set; } = true;

    public Product(string sku, string brand, string model, string size, decimal price)
    {
        Sku = sku; Brand = brand; ModelName = model; Size = size; Price = price;
    }

    private Product() { }
}
