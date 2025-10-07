namespace Roue.Domain.Rewards;
public enum RewardTxnType { Earn, Redeem, Adjust }

public sealed class RewardAccount
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public int Balance { get; private set; }
}

public sealed class RewardTransaction
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid AccountId { get; private set; }
    public RewardTxnType Type { get; private set; }
    public int Points { get; private set; }
    public string Reference { get; private set; } = default!; // OrderId, ajuste, etc.
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
}