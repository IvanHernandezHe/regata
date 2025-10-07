using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Roue.Application.DTOs;
using Roue.Application.Interface;
using Roue.Domain.Orders;
using Roue.API.Payments;
using Roue.Application.Validation;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class OrdersController : ControllerBase
{
    private readonly UserManager<IdentityUser<Guid>> _users;
    private readonly IAuditLogger _audit;
    private readonly IOrdersService _svc;
    private readonly IInventoryService _inventory;
    private readonly IConfiguration _cfg;
    private readonly StripeCheckoutService _stripe;
    private readonly Roue.Infrastructure.Integration.WebhookDispatcher _webhooks;
    private readonly Roue.Infrastructure.Persistence.AppDbContext _db;
    private readonly IEmailSender _email;
    public OrdersController(UserManager<IdentityUser<Guid>> users, IAuditLogger audit, IOrdersService svc, IInventoryService inventory, IConfiguration cfg, StripeCheckoutService stripe, Roue.Infrastructure.Integration.WebhookDispatcher webhooks, Roue.Infrastructure.Persistence.AppDbContext db, IEmailSender email)
    { _users = users; _audit = audit; _svc = svc; _inventory = inventory; _cfg = cfg; _stripe = stripe; _webhooks = webhooks; _db = db; _email = email; }

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var list = await _svc.GetMineAsync(user.Id, 20, HttpContext.RequestAborted);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var detail = await _svc.GetByIdAsync(user.Id, id, HttpContext.RequestAborted);
        if (detail is null) return NotFound();
        return Ok(detail);
    }

    public sealed record CheckoutItem(Guid ProductId, [property: JsonPropertyName("quantity")] int Quantity);
    public sealed record CheckoutRequest(List<CheckoutItem> Items, string? DiscountCode, string? ReservationToken, Guid? AddressId);
    public sealed record CheckoutResponse(Guid OrderId, decimal Subtotal, decimal Discount, decimal Shipping, decimal Total, string Currency, string CheckoutUrl);
    public sealed record QuoteResponse(decimal Subtotal, decimal Discount, decimal Shipping, decimal Total, string Currency, object[] Items);
    public sealed record ReserveRequest(List<CheckoutItem> Items, int TtlSeconds = 600);
    public sealed record ReserveResponse(string Token, DateTime ExpiresAtUtc);
    public sealed record ReleaseReservationRequest(string Token);
    public sealed record CancelOrderResponse(bool Cancelled);

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var lines = req.Items?.Select(i => new CheckoutLineDto(i.ProductId, i.Quantity)).ToList() ?? new List<CheckoutLineDto>();
        var validator = new CheckoutLinesValidator();
        var validation = validator.Validate(lines);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => e.ErrorMessage).ToArray();
            return BadRequest(new { errors });
        }
        CheckoutResponseDto result;
        try { result = await _svc.CheckoutAsync(user.Id, lines, req.DiscountCode, req.AddressId, req.ReservationToken, HttpContext.RequestAborted); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        // Decide payment provider
        var configuredProvider = _cfg["Payments:Provider"] ?? "Sandbox";
        var stripeApiKey = _cfg["Stripe:ApiKey"] ?? string.Empty;
        var stripeConfigured = !string.IsNullOrWhiteSpace(stripeApiKey) && !stripeApiKey.Contains("REEMPLAZA", StringComparison.OrdinalIgnoreCase);
        var provider = configuredProvider;
        if (provider.Equals("Stripe", StringComparison.OrdinalIgnoreCase) && !stripeConfigured)
        {
            provider = "Sandbox";
            await _audit.LogAsync("order.checkout_provider_fallback", subjectType: nameof(Order), subjectId: result.OrderId.ToString(), description: "Stripe no configurado. Se usa Sandbox.");
        }
        string checkoutUrl;
        if (provider.Equals("Stripe", StringComparison.OrdinalIgnoreCase))
        {
            var stripeCfg = _cfg.GetSection("Stripe");
            var baseUrl = stripeCfg?["ReturnUrlBase"];
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                var origins = _cfg.GetSection("Cors:Origins").Get<string[]>() ?? new[] { "http://localhost:4200" };
                baseUrl = origins.FirstOrDefault() ?? "http://localhost:4200";
            }
            var successPath = stripeCfg?["SuccessPath"] ?? "/checkout/gracias";
            var cancelPath = stripeCfg?["CancelPath"] ?? "/cart";
            var successUrl = CombineUrl(baseUrl, successPath);
            successUrl = AppendQuery(successUrl, "orderId", result.OrderId.ToString());
            var cancelUrl = CombineUrl(baseUrl, cancelPath);
            try
            {
                checkoutUrl = await _stripe.CreateCheckoutAsync(result.OrderId, req.ReservationToken, successUrl, cancelUrl, HttpContext.RequestAborted);
            }
            catch (Exception ex)
            {
                await _audit.LogAsync("order.checkout_stripe_error", subjectType: nameof(Order), subjectId: result.OrderId.ToString(), description: ex.Message);
                return StatusCode(500, new { error = "No se pudo iniciar el pago" });
            }
        }
        else
        {
            checkoutUrl = Url.ActionLink(nameof(PaySandbox), values: new { orderId = result.OrderId }) ?? $"/api/orders/pay/sandbox/{result.OrderId}";
        }
        await _audit.LogAsync("order.checkout_initiated", subjectType: nameof(Order), subjectId: result.OrderId.ToString(), metadata: new { result.Total, result.Subtotal, result.Discount });
        _ = _webhooks.SendAsync("order.created", new { orderId = result.OrderId, total = result.Total, currency = result.Currency }, HttpContext.RequestAborted);
        return CreatedAtAction(nameof(GetMine), new { }, new { result.OrderId, result.Subtotal, result.Discount, result.Shipping, result.Total, result.Currency, CheckoutUrl = checkoutUrl });
    }

    [HttpPost("quote")]
    [AllowAnonymous]
    public async Task<IActionResult> Quote([FromBody] CheckoutRequest req)
    {
        var qLines = req.Items?.Select(i => new CheckoutLineDto(i.ProductId, i.Quantity)).ToList() ?? new List<CheckoutLineDto>();
        var validator = new CheckoutLinesValidator();
        var validation = validator.Validate(qLines);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => e.ErrorMessage).ToArray();
            return BadRequest(new { errors });
        }
        try { var quote = await _svc.QuoteAsync(qLines, req.DiscountCode, HttpContext.RequestAborted); return Ok(quote); }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    // Sandbox payment flow: marks the order as paid and redirects to /perfil on the SPA
    [HttpGet("pay/sandbox/{orderId}")]
    public async Task<IActionResult> PaySandbox([FromRoute] Guid orderId)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        try
        {
            var ok = await _svc.MarkPaidSandboxAsync(user.Id, orderId, HttpContext.RequestAborted);
            await _audit.LogAsync(ok ? "order.paid_sandbox" : "order.paid_sandbox_inventory_short",
                subjectType: nameof(Order), subjectId: orderId.ToString());
            if (ok)
            {
                var order = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == orderId);
                if (order is not null)
                {
                    var u = await _users.FindByIdAsync(order.UserId.ToString());
                    if (u?.Email is not null) { _ = _email.SendAsync(u.Email, "Confirmación de pago", $"<p>Gracias por tu compra. Pedido {order.Id}</p>"); }
                    _ = _webhooks.SendAsync("order.paid", new { orderId = order.Id, total = order.Total, currency = order.Currency }, HttpContext.RequestAborted);
                }
            }
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }

        // minimal HTML response redirecting back to SPA confirmation page
        var successPath = AppendQuery("/checkout/gracias", "orderId", orderId.ToString());
        var html = $"<!DOCTYPE html><html><head><meta charset=\\\"utf-8\\\"><meta http-equiv=\\\"refresh\\\" content=\\\"0;url={successPath}\\\"><title>Sandbox Payment</title></head><body>Sandbox payment successful. Redirecting…</body></html>";
        return Content(html, "text/html");
    }

    [HttpPost("reserve")]
    [AllowAnonymous]
    public async Task<IActionResult> Reserve([FromBody] ReserveRequest req)
    {
        var rLines = req.Items?.Select(i => new CheckoutLineDto(i.ProductId, i.Quantity)).ToList() ?? new List<CheckoutLineDto>();
        if (rLines.Count == 0) return BadRequest("No items");
        try { var res = await _svc.ReserveAsync(rLines, req.TtlSeconds, HttpContext.RequestAborted); return Ok(res); }
        catch (Exception ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpPost("release")]
    [AllowAnonymous]
    public async Task<IActionResult> Release([FromBody] ReleaseReservationRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Token)) return BadRequest();
        await _svc.ReleaseAsync(req.Token, HttpContext.RequestAborted);
        await _audit.LogAsync("inventory.reservation_released", subjectType: "Reservation", subjectId: req.Token);
        return NoContent();
    }

    [HttpPost("{orderId}/cancel")]
    public async Task<IActionResult> Cancel([FromRoute] Guid orderId)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        try
        {
            var ok = await _svc.CancelAsync(user.Id, orderId, HttpContext.RequestAborted);
            await _audit.LogAsync(ok ? "order.cancelled" : "order.cancel_denied", subjectType: nameof(Order), subjectId: orderId.ToString());
            if (!ok) return Conflict(new { error = "No se puede cancelar una orden pagada" });
            return Ok(new CancelOrderResponse(true));
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
    private static string CombineUrl(string baseUrl, string path)
    {
        if (string.IsNullOrWhiteSpace(baseUrl)) return path;
        if (string.IsNullOrWhiteSpace(path)) return baseUrl.TrimEnd('/');
        return baseUrl.TrimEnd('/') + (path.StartsWith('/') ? path : "/" + path);
    }

    private static string AppendQuery(string url, string key, string value)
    {
        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(key) || value is null) return url;
        var separator = url.Contains('?') ? '&' : '?';
        return $"{url}{separator}{Uri.EscapeDataString(key)}={Uri.EscapeDataString(value)}";
    }
}
