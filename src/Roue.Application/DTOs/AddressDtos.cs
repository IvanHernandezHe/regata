namespace Roue.Application.DTOs;

public sealed record AddressDto(
    Guid Id,
    string Line1,
    string? Line2,
    string City,
    string State,
    string PostalCode,
    string Country,
    bool IsDefault
);

public sealed record UpsertAddressDto(
    string Line1,
    string? Line2,
    string City,
    string State,
    string PostalCode,
    string Country,
    bool IsDefault
);

