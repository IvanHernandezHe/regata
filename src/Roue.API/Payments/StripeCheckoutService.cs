using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using Roue.Infrastructure.Persistence;
using Roue.Domain.Orders;

namespace Roue.API.Payments;

public sealed class StripeCheckoutService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _cfg;
    private readonly UserManager<IdentityUser<Guid>> _users;
    public StripeCheckoutService(AppDbContext db, IConfiguration cfg, UserManager<IdentityUser<Guid>> users)
    { _db = db; _cfg = cfg; _users = users; }

    public async Task<string> CreateCheckoutAsync(Guid orderId, string? reservationToken, string successUrl, string cancelUrl, CancellationToken ct)
    {
        var apiKey = _cfg["Stripe:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey)) throw new InvalidOperationException("Stripe ApiKey no configurado");
        StripeConfiguration.ApiKey = apiKey;

        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct);
        if (order is null) throw new KeyNotFoundException("Orden no encontrada");
        var user = await _users.FindByIdAsync(order.UserId.ToString())!;
        var items = await _db.OrderItems.AsNoTracking().Where(i => i.OrderId == orderId).ToListAsync(ct);
        if (items.Count == 0) throw new InvalidOperationException("Orden sin items");

        var lineItems = new List<SessionLineItemOptions>();
        foreach (var it in items)
        {
            // Stripe amounts are in cents
            var unitAmount = (long)Math.Round(it.UnitPrice * 100m, MidpointRounding.AwayFromZero);
            lineItems.Add(new SessionLineItemOptions
            {
                Quantity = it.Quantity,
                PriceData = new SessionLineItemPriceDataOptions
                {
                    Currency = (order.Currency ?? "MXN").ToLowerInvariant(),
                    UnitAmount = unitAmount,
                    ProductData = new SessionLineItemPriceDataProductDataOptions
                    {
                        Name = it.ProductName,
                        Metadata = new Dictionary<string, string> { { "sku", it.ProductSku ?? string.Empty }, { "size", it.Size ?? string.Empty } }
                    }
                }
            });
        }

        var metadata = new Dictionary<string, string>
        {
            ["orderId"] = order.Id.ToString()
        };
        if (!string.IsNullOrWhiteSpace(reservationToken)) metadata["reservationToken"] = reservationToken!;

        var options = new SessionCreateOptions
        {
            Mode = "payment",
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
            LineItems = lineItems,
            Metadata = metadata,
            CustomerEmail = user?.Email,
            Currency = (order.Currency ?? "MXN").ToLowerInvariant(),
            // Payment intent description helps reconciling
            PaymentIntentData = new SessionPaymentIntentDataOptions
            {
                Metadata = metadata,
                Description = $"Roue order {order.Id}"
            }
        };

        var svc = new SessionService();
        var session = await svc.CreateAsync(options, cancellationToken: ct);

        // Mark order as Stripe pending and store reference
        order.GetType().GetProperty(nameof(Order.PaymentProvider))!.SetValue(order, PaymentProvider.Stripe);
        order.GetType().GetProperty(nameof(Order.PaymentStatus))!.SetValue(order, PaymentStatus.Pending);
        order.GetType().GetProperty(nameof(Order.PaymentReference))!.SetValue(order, session.Id);
        await _db.SaveChangesAsync(ct);

        return session.Url!;
    }
}
