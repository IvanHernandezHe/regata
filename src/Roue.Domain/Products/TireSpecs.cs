namespace Roue.Domain.Products;

public sealed class TireSpecs
{
    public Guid ProductId { get; private set; }
    public Product Product { get; private set; } = default!;
    public string? Type { get; private set; }
    public string? LoadIndex { get; private set; }
    public string? SpeedRating { get; private set; }

    public TireSpecs(Guid productId, string? type, string? loadIndex, string? speedRating)
    { ProductId = productId; Type = type; LoadIndex = loadIndex; SpeedRating = speedRating; }

    private TireSpecs() { }
}
