namespace Roue.Domain.Marketing;
public enum DiscountType { Percentage, FixedAmount, FreeService }

public sealed class DiscountCode
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Code { get; private set; } = default!; // e.g. "ROUE20"
    public DiscountType Type { get; private set; }
    public decimal Value { get; private set; }
    public int MaxRedemptions { get; private set; } = 1000;
    public int Redemptions { get; private set; } = 0;
    public DateTime? ExpiresAtUtc { get; private set; }
    public bool Active { get; private set; } = true;
    public string? CampaignSource { get; private set; } // utm_source/influencer
}
