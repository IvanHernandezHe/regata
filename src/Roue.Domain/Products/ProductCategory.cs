namespace Roue.Domain.Products;

public sealed class ProductCategory
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = default!;
    public string Slug { get; private set; } = default!;
    public bool Active { get; private set; } = true;

    public ProductCategory(string name, string slug)
    { Name = name; Slug = slug; }

    private ProductCategory() { }
}

