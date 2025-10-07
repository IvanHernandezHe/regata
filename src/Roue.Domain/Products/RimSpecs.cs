namespace Roue.Domain.Products;

public sealed class RimSpecs
{
    public Guid ProductId { get; private set; }
    public Product Product { get; private set; } = default!;
    public double? DiameterIn { get; private set; }
    public double? WidthIn { get; private set; }
    public string? BoltPattern { get; private set; }
    public int? OffsetMm { get; private set; }
    public double? CenterBoreMm { get; private set; }
    public string? Material { get; private set; }
    public string? Finish { get; private set; }

    public RimSpecs(Guid productId, double? diameterIn, double? widthIn, string? boltPattern, int? offsetMm, double? centerBoreMm, string? material, string? finish)
    { ProductId = productId; DiameterIn = diameterIn; WidthIn = widthIn; BoltPattern = boltPattern; OffsetMm = offsetMm; CenterBoreMm = centerBoreMm; Material = material; Finish = finish; }

    private RimSpecs() { }
}
