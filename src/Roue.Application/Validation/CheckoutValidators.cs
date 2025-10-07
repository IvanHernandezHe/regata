using FluentValidation;
using Roue.Application.DTOs;

namespace Roue.Application.Validation;

public sealed class CheckoutLineValidator : AbstractValidator<CheckoutLineDto>
{
    public CheckoutLineValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}

public sealed class CheckoutLinesValidator : AbstractValidator<IReadOnlyList<CheckoutLineDto>>
{
    public CheckoutLinesValidator()
    {
        RuleFor(x => x).NotNull();
        RuleFor(x => x.Count).GreaterThan(0);
        RuleForEach(x => x).SetValidator(new CheckoutLineValidator());
    }
}

