using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Regata.Infrastructure.Persistence;
using Regata.Domain.Orders;
using Regata.Domain.Marketing;
using Regata.Application.Interface;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<IdentityUser<Guid>> _users;
    private readonly IAuditLogger _audit;
    public OrdersController(AppDbContext db, UserManager<IdentityUser<Guid>> users, IAuditLogger audit, IInventoryService inventory)
    {
        _db = db; _users = users; _audit = audit; _inventory = inventory;
    }
    private readonly IInventoryService _inventory;

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var userId = user.Id;
        // return minimal history; currently no creation logic implemented
        var list = await _db.Orders.AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Take(20)
            .Select(o => new { o.Id, o.Total, o.Status, o.CreatedAtUtc })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var order = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id && o.UserId == user.Id);
        if (order is null) return NotFound();
        var items = await _db.OrderItems.AsNoTracking()
            .Where(i => i.OrderId == id)
            .Select(i => new { i.ProductId, i.ProductName, i.ProductSku, i.Size, i.UnitPrice, i.Quantity, lineTotal = i.UnitPrice * i.Quantity })
            .ToListAsync();
        return Ok(new
        {
            order.Id,
            order.Total,
            order.Subtotal,
            order.DiscountAmount,
            order.Currency,
            order.Status,
            order.PaymentStatus,
            order.PaymentProvider,
            order.CreatedAtUtc,
            items
        });
    }

    public sealed record CheckoutItem(Guid ProductId, int Quantity);
    public sealed record CheckoutRequest(List<CheckoutItem> Items, string? DiscountCode, string? ReservationToken);
    public sealed record CheckoutResponse(Guid OrderId, decimal Subtotal, decimal Discount, decimal Total, string Currency, string CheckoutUrl);
    public sealed record QuoteResponse(decimal Subtotal, decimal Discount, decimal Total, string Currency, object[] Items);
    public sealed record ReserveRequest(List<CheckoutItem> Items, int TtlSeconds = 600);
    public sealed record ReserveResponse(string Token, DateTime ExpiresAtUtc);
    public sealed record ReleaseReservationRequest(string Token);

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        if (req is null || req.Items is null || req.Items.Count == 0)
            return BadRequest("No se enviaron artículos para el checkout.");

        // normalize quantities
        var normalized = req.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Quantity = Math.Max(1, g.Sum(x => x.Quantity)) })
            .ToList();

        var ids = normalized.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products.AsNoTracking()
            .Where(p => ids.Contains(p.Id) && p.Active)
            .ToListAsync();

        // build order lines (skip unknown products)
        var orderLines = new List<(Guid ProductId, string Name, string Sku, string Size, decimal UnitPrice, int Quantity)>();
        foreach (var item in normalized)
        {
            var p = products.FirstOrDefault(x => x.Id == item.ProductId);
            if (p is null) continue;
            orderLines.Add((p.Id, $"{p.Brand} {p.ModelName} {p.Size}", p.Sku, p.Size, p.Price, item.Quantity));
        }
        if (orderLines.Count == 0)
            return BadRequest("No hay productos válidos para procesar.");

        var subtotal = orderLines.Sum(l => l.UnitPrice * l.Quantity);

        // discount code (if any)
        decimal discount = 0m;
        string? appliedCode = null;
        if (!string.IsNullOrWhiteSpace(req.DiscountCode))
        {
            var code = (req.DiscountCode ?? string.Empty).Trim();
            var dc = await _db.DiscountCodes.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Code == code && x.Active && (!x.ExpiresAtUtc.HasValue || x.ExpiresAtUtc > DateTime.UtcNow) && x.Redemptions < x.MaxRedemptions);
            if (dc is not null)
            {
                appliedCode = dc.Code;
                if (dc.Type == DiscountType.Percentage)
                {
                    discount = Math.Round(subtotal * (dc.Value / 100m), 2, MidpointRounding.AwayFromZero);
                }
                else if (dc.Type == DiscountType.FixedAmount)
                {
                    discount = Math.Max(0m, Math.Min(subtotal, dc.Value));
                }
                else
                {
                    // FreeService or others: for now treated as zero discount (service added elsewhere)
                    discount = 0m;
                }
            }
        }

        var total = Math.Max(0m, subtotal - discount);

        // create Order
        var order = new Order();
        // set using reflection-like since props have private setters; use pattern via EF tracked entity
        // Attach initial values through EF entry
        order.GetType().GetProperty(nameof(Order.UserId))!.SetValue(order, user.Id);
        order.GetType().GetProperty(nameof(Order.Subtotal))!.SetValue(order, subtotal);
        order.GetType().GetProperty(nameof(Order.DiscountAmount))!.SetValue(order, discount);
        order.GetType().GetProperty(nameof(Order.Total))!.SetValue(order, total);
        order.GetType().GetProperty(nameof(Order.Currency))!.SetValue(order, "MXN");
        order.GetType().GetProperty(nameof(Order.PaymentProvider))!.SetValue(order, PaymentProvider.None);
        order.GetType().GetProperty(nameof(Order.PaymentStatus))!.SetValue(order, PaymentStatus.Pending);
        order.GetType().GetProperty(nameof(Order.Status))!.SetValue(order, OrderStatus.Created);
        if (appliedCode is not null)
            order.GetType().GetProperty(nameof(Order.DiscountCode))!.SetValue(order, appliedCode);

        foreach (var l in orderLines)
        {
            var oi = new OrderItem();
            oi.GetType().GetProperty(nameof(OrderItem.OrderId))!.SetValue(oi, order.Id);
            oi.GetType().GetProperty(nameof(OrderItem.ProductId))!.SetValue(oi, l.ProductId);
            oi.GetType().GetProperty(nameof(OrderItem.ProductName))!.SetValue(oi, l.Name);
            oi.GetType().GetProperty(nameof(OrderItem.ProductSku))!.SetValue(oi, l.Sku);
            oi.GetType().GetProperty(nameof(OrderItem.Size))!.SetValue(oi, l.Size);
            oi.GetType().GetProperty(nameof(OrderItem.UnitPrice))!.SetValue(oi, l.UnitPrice);
            oi.GetType().GetProperty(nameof(OrderItem.Quantity))!.SetValue(oi, l.Quantity);
            _db.OrderItems.Add(oi);
            order.Items.Add(oi);
        }

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("order.checkout_initiated", subjectType: nameof(Order), subjectId: order.Id.ToString(), metadata: new { total, subtotal, discount });

        // Sandbox checkout URL within API: user must be logged and owner
        // Persist reservation token in PaymentReference if provided
        if (!string.IsNullOrWhiteSpace(req.ReservationToken))
        {
            order.GetType().GetProperty(nameof(Order.PaymentReference))!.SetValue(order, $"resv:{req.ReservationToken}");
            await _db.SaveChangesAsync();
        }
        var checkoutUrl = Url.ActionLink(nameof(PaySandbox), values: new { orderId = order.Id }) ?? $"/api/orders/pay/sandbox/{order.Id}";
        var resp = new CheckoutResponse(order.Id, subtotal, discount, total, "MXN", checkoutUrl);
        return CreatedAtAction(nameof(GetMine), new { }, resp);
    }

    [HttpPost("quote")]
    [AllowAnonymous]
    public async Task<IActionResult> Quote([FromBody] CheckoutRequest req)
    {
        if (req is null || req.Items is null || req.Items.Count == 0)
            return BadRequest("No se enviaron artículos.");
        var normalized = req.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Quantity = Math.Max(1, g.Sum(x => x.Quantity)) })
            .ToList();
        var ids = normalized.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products.AsNoTracking()
            .Where(p => ids.Contains(p.Id) && p.Active)
            .ToListAsync();
        var lines = new List<dynamic>();
        foreach (var item in normalized)
        {
            var p = products.FirstOrDefault(x => x.Id == item.ProductId);
            if (p is null) continue;
            lines.Add(new { p.Id, p.Brand, p.ModelName, p.Size, UnitPrice = p.Price, item.Quantity, LineTotal = p.Price * item.Quantity });
        }
        if (lines.Count == 0) return BadRequest("No hay productos válidos");
        var subtotal = lines.Sum(l => (decimal)l.LineTotal);
        decimal discount = 0m;
        if (!string.IsNullOrWhiteSpace(req.DiscountCode))
        {
            var code = (req.DiscountCode ?? "").Trim();
            var dc = await _db.DiscountCodes.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Code == code && x.Active && (!x.ExpiresAtUtc.HasValue || x.ExpiresAtUtc > DateTime.UtcNow) && x.Redemptions < x.MaxRedemptions);
            if (dc is not null)
            {
                if (dc.Type == DiscountType.Percentage)
                    discount = Math.Round(subtotal * (dc.Value / 100m), 2, MidpointRounding.AwayFromZero);
                else if (dc.Type == DiscountType.FixedAmount)
                    discount = Math.Max(0m, Math.Min(subtotal, dc.Value));
            }
        }
        var total = Math.Max(0m, subtotal - discount);
        return Ok(new QuoteResponse(subtotal, discount, total, "MXN", lines.Cast<object>().ToArray()));
    }

    // Sandbox payment flow: marks the order as paid and redirects to /perfil on the SPA
    [HttpGet("pay/sandbox/{orderId}")]
    public async Task<IActionResult> PaySandbox([FromRoute] Guid orderId)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order is null) return NotFound();
        if (order.UserId != user.Id) return Forbid();

        // set statuses
        order.GetType().GetProperty(nameof(Order.PaymentStatus))!.SetValue(order, PaymentStatus.Succeeded);
        order.GetType().GetProperty(nameof(Order.Status))!.SetValue(order, OrderStatus.Paid);
        await _db.SaveChangesAsync();
        // consume inventory (best-effort; return simple html either way)
        var token = (order.PaymentReference != null && order.PaymentReference.StartsWith("resv:")) ? order.PaymentReference.Substring(5) : null;
        var ok = await _inventory.CommitOnPaymentAsync(order, token);
        await _audit.LogAsync(ok ? "order.paid_sandbox" : "order.paid_sandbox_inventory_short",
            subjectType: nameof(Order), subjectId: order.Id.ToString());

        // minimal HTML response redirecting back to SPA profile
        var html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"refresh\" content=\"0;url=/perfil\"><title>Pago simulado</title></head><body>Pago simulado exitoso. Redirigiendo…</body></html>";
        return Content(html, "text/html");
    }

    [HttpPost("reserve")]
    [AllowAnonymous]
    public async Task<IActionResult> Reserve([FromBody] ReserveRequest req)
    {
        if (req is null || req.Items is null || req.Items.Count == 0) return BadRequest("sin items");
        var ttl = TimeSpan.FromSeconds(Math.Clamp(req.TtlSeconds, 60, 3600));
        var lines = req.Items.Select(i => (i.ProductId, Math.Max(1, i.Quantity)));
        var (ok, token, expiresAt, error) = await _inventory.ReserveAsync(lines, ttl, reference: "checkout", HttpContext.RequestAborted);
        if (!ok) return Conflict(new { error = error ?? "no disponible" });
        return Ok(new ReserveResponse(token, expiresAt));
    }

    [HttpPost("release")]
    [AllowAnonymous]
    public async Task<IActionResult> Release([FromBody] ReleaseReservationRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Token)) return BadRequest();
        await _inventory.ReleaseAsync(req.Token, HttpContext.RequestAborted);
        await _audit.LogAsync("inventory.reservation_released", subjectType: "Reservation", subjectId: req.Token);
        return NoContent();
    }
}
