namespace Roue.Domain.Products;

public sealed class Brand
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = default!;
    public string? LogoUrl { get; private set; }
    public bool Active { get; private set; } = true;

    public Brand(string name, string? logoUrl = null)
    { Name = name; LogoUrl = logoUrl; }

    private Brand() { }
}