using FluentValidation;
using Roue.Application.DTOs;

namespace Roue.Application.Validation;

public sealed class UpsertAddressValidator : AbstractValidator<UpsertAddressDto>
{
    public UpsertAddressValidator()
    {
        RuleFor(x => x.Line1).NotEmpty().MaximumLength(200);
        RuleFor(x => x.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.State).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PostalCode).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Country).NotEmpty().Length(2);
    }
}

