namespace Roue.Domain.Accounts;

public sealed class Address
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UserId { get; private set; }
    public string Line1 { get; private set; } = default!;
    public string? Line2 { get; private set; }
    public string City { get; private set; } = default!;
    public string State { get; private set; } = default!;
    public string PostalCode { get; private set; } = default!;
    public string Country { get; private set; } = "MX";
    public bool IsDefault { get; private set; }
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; private set; } = DateTime.UtcNow;

    public Address() { }
    public Address(Guid userId, string line1, string? line2, string city, string state, string postalCode, string country = "MX", bool isDefault = false)
    {
        UserId = userId; Line1 = line1; Line2 = line2; City = city; State = state; PostalCode = postalCode; Country = country; IsDefault = isDefault;
    }

    public void Update(string line1, string? line2, string city, string state, string postalCode, string country)
    {
        Line1 = line1; Line2 = line2; City = city; State = state; PostalCode = postalCode; Country = country; UpdatedAtUtc = DateTime.UtcNow;
    }
    public void SetDefault(bool isDefault) { IsDefault = isDefault; UpdatedAtUtc = DateTime.UtcNow; }
}

