using Microsoft.AspNetCore.Mvc;
using Stripe;
using Regata.Infrastructure.Persistence;
using Regata.Application.Interface;
using Microsoft.EntityFrameworkCore;

namespace Regata.API.Controllers.Payments;

[ApiController]
[Route("api/payments/stripe/webhook")]
public sealed class StripeWebhookController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;
    private readonly IInventoryService _inventory;
    private readonly IConfiguration _cfg;
    public StripeWebhookController(AppDbContext db, IAuditLogger audit, IInventoryService inventory, IConfiguration cfg)
    { _db = db; _audit = audit; _inventory = inventory; _cfg = cfg; }

    [HttpPost]
    public async Task<IActionResult> Receive()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var secret = _cfg["Stripe:WebhookSecret"];
        Event evt;
        try
        {
            if (!string.IsNullOrWhiteSpace(secret))
            {
                var sigHeader = Request.Headers["Stripe-Signature"];
                evt = EventUtility.ConstructEvent(json, sigHeader, secret);
            }
            else
            {
                evt = EventUtility.ParseEvent(json);
            }
        }
        catch (Exception ex)
        {
            await _audit.LogAsync("stripe.webhook.invalid", description: ex.Message, metadata: new { body = json });
            return BadRequest();
        }

        try
        {
            switch (evt.Type)
            {
                case Events.CheckoutSessionCompleted:
                {
                    var session = evt.Data.Object as Stripe.Checkout.Session;
                    var orderId = session?.Metadata != null && session.Metadata.TryGetValue("orderId", out var oid) ? oid : null;
                    var resv = session?.Metadata != null && session.Metadata.TryGetValue("reservationToken", out var rt) ? rt : null;
                    if (Guid.TryParse(orderId, out var id))
                    {
                        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
                        if (order != null)
                        {
                            order.GetType().GetProperty(nameof(Domain.Orders.Order.PaymentStatus))!.SetValue(order, Domain.Orders.PaymentStatus.Succeeded);
                            order.GetType().GetProperty(nameof(Domain.Orders.Order.Status))!.SetValue(order, Domain.Orders.OrderStatus.Paid);
                            await _db.SaveChangesAsync();
                            var ok = await _inventory.CommitOnPaymentAsync(order, resv);
                            await _audit.LogAsync(ok ? "order.paid_stripe" : "order.paid_stripe_inventory_short", subjectType: nameof(Domain.Orders.Order), subjectId: order.Id.ToString());
                        }
                    }
                    break;
                }
                case Events.PaymentIntentSucceeded:
                {
                    var intent = evt.Data.Object as PaymentIntent;
                    var orderId = intent?.Metadata != null && intent.Metadata.TryGetValue("orderId", out var oid) ? oid : null;
                    var resv = intent?.Metadata != null && intent.Metadata.TryGetValue("reservationToken", out var rt) ? rt : null;
                    if (Guid.TryParse(orderId, out var id))
                    {
                        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
                        if (order != null)
                        {
                            order.GetType().GetProperty(nameof(Domain.Orders.Order.PaymentStatus))!.SetValue(order, Domain.Orders.PaymentStatus.Succeeded);
                            order.GetType().GetProperty(nameof(Domain.Orders.Order.Status))!.SetValue(order, Domain.Orders.OrderStatus.Paid);
                            await _db.SaveChangesAsync();
                            var ok = await _inventory.CommitOnPaymentAsync(order, resv);
                            await _audit.LogAsync(ok ? "order.paid_stripe" : "order.paid_stripe_inventory_short", subjectType: nameof(Domain.Orders.Order), subjectId: order.Id.ToString());
                        }
                    }
                    break;
                }
                default:
                    break;
            }
        }
        catch (Exception ex)
        {
            await _audit.LogAsync("stripe.webhook.error", description: ex.Message);
            return StatusCode(500);
        }
        return Ok();
    }
}
