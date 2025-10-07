using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Roue.Domain.Orders;
using Roue.Application.Interface;

namespace Roue.API.Controllers.Admin;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "Admin")]
public sealed class OrdersAdminController : ControllerBase
{
    private readonly IAuditLogger _audit;
    private readonly IOrderAdminService _svc;
    public OrdersAdminController(IAuditLogger audit, IOrderAdminService svc)
    { _audit = audit; _svc = svc; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] OrderStatus? status, [FromQuery] PaymentStatus? paymentStatus, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var (total, items) = await _svc.ListAsync(status, paymentStatus, page, pageSize, HttpContext.RequestAborted);
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get([FromRoute] Guid id)
    {
        var dto = await _svc.GetAsync(id, HttpContext.RequestAborted);
        if (dto is null) return NotFound();
        return Ok(dto);
    }

    public sealed record UpdateStatusRequest(OrderStatus Status);
    [HttpPost("{id}/status")]
    public async Task<IActionResult> SetStatus([FromRoute] Guid id, [FromBody] UpdateStatusRequest body)
    {
        try
        {
            await _svc.SetStatusAsync(id, body.Status, HttpContext.RequestAborted);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        await _audit.LogAsync("order.status_updated", subjectType: nameof(Order), subjectId: id.ToString(), metadata: new { body.Status });
        _ = HttpContext.RequestServices.GetRequiredService<Roue.Infrastructure.Integration.WebhookDispatcher>()
            .SendAsync("order.status_updated", new { orderId = id, status = body.Status.ToString() }, HttpContext.RequestAborted);
        return NoContent();
    }

    public sealed record UpdatePaymentStatusRequest(PaymentStatus PaymentStatus);
    [HttpPost("{id}/payment-status")]
    public async Task<IActionResult> SetPaymentStatus([FromRoute] Guid id, [FromBody] UpdatePaymentStatusRequest body)
    {
        try
        {
            await _svc.SetPaymentStatusAsync(id, body.PaymentStatus, HttpContext.RequestAborted);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        await _audit.LogAsync("order.payment_status_updated", subjectType: nameof(Order), subjectId: id.ToString(), metadata: new { body.PaymentStatus });
        _ = HttpContext.RequestServices.GetRequiredService<Roue.Infrastructure.Integration.WebhookDispatcher>()
            .SendAsync("order.payment_status_updated", new { orderId = id, paymentStatus = body.PaymentStatus.ToString() }, HttpContext.RequestAborted);
        return NoContent();
    }

    public sealed record SetShipmentRequest(string? Carrier, string? TrackingCode, DateTime? ShippedAtUtc);
    [HttpPost("{id}/shipment")]
    public async Task<IActionResult> SetShipment([FromRoute] Guid id, [FromBody] SetShipmentRequest body)
    {
        try
        {
            await _svc.SetShipmentAsync(id, body.Carrier, body.TrackingCode, body.ShippedAtUtc, HttpContext.RequestAborted);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        await _audit.LogAsync("order.shipment_updated", subjectType: nameof(Order), subjectId: id.ToString(), metadata: new { body.Carrier, body.TrackingCode, body.ShippedAtUtc });
        _ = HttpContext.RequestServices.GetRequiredService<Roue.Infrastructure.Integration.WebhookDispatcher>()
            .SendAsync("order.shipment_updated", new { orderId = id, body.Carrier, body.TrackingCode, body.ShippedAtUtc }, HttpContext.RequestAborted);
        return NoContent();
    }

    public sealed record CreateOrderItem(Guid ProductId, [property: JsonPropertyName("qty")] int Qty);
    public sealed record CreateOrderShip(string Line1, string? Line2, string City, string State, string PostalCode, string Country = "MX");
    public sealed record CreateOrderRequest(Guid? UserId, string? UserEmail, string? DiscountCode, List<CreateOrderItem>? Items, CreateOrderShip? Shipping);
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest body)
    {
        // Resolve user
        Guid userId;
        if (body.UserId.HasValue && body.UserId.Value != Guid.Empty) userId = body.UserId.Value;
        else if (!string.IsNullOrWhiteSpace(body.UserEmail))
        {
            var u = await HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<Microsoft.AspNetCore.Identity.IdentityUser<Guid>>>()
                .FindByEmailAsync(body.UserEmail);
            if (u is null) return BadRequest(new { error = "User not found" });
            userId = u.Id;
        }
        else return BadRequest(new { error = "UserId or UserEmail required" });

        var items = body.Items?.Select(i => (i.ProductId, Math.Max(1, i.Qty))) ?? Enumerable.Empty<(Guid, int)>();
        var dto = await _svc.CreateAsync(userId, items, body.DiscountCode, HttpContext.RequestAborted);
        if (body.Shipping is not null)
        {
            dto = await _svc.UpdateShippingAsync(dto.Id, body.Shipping.Line1, body.Shipping.Line2, body.Shipping.City, body.Shipping.State, body.Shipping.PostalCode, string.IsNullOrWhiteSpace(body.Shipping.Country) ? "MX" : body.Shipping.Country, HttpContext.RequestAborted);
        }
        await _audit.LogAsync("order.admin_created", subjectType: nameof(Domain.Orders.Order), subjectId: dto.Id.ToString());
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    public sealed record UpsertItemRequest(Guid ProductId, [property: JsonPropertyName("qty")] int Qty);
    [HttpPost("{id}/items")]
    public async Task<IActionResult> AddOrUpdateItem([FromRoute] Guid id, [FromBody] UpsertItemRequest body)
    {
        try { var dto = await _svc.SetItemQtyAsync(id, body.ProductId, Math.Max(1, body.Qty), HttpContext.RequestAborted); await _audit.LogAsync("order.item_upserted", subjectType: nameof(Domain.Orders.Order), subjectId: id.ToString(), metadata: new { body.ProductId, body.Qty }); return Ok(dto); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpPut("{id}/items/{productId}")]
    public async Task<IActionResult> SetItemQty([FromRoute] Guid id, [FromRoute] Guid productId, [FromBody] UpsertItemRequest body)
    {
        try { var dto = await _svc.SetItemQtyAsync(id, productId, Math.Max(0, body.Qty), HttpContext.RequestAborted); await _audit.LogAsync("order.item_qty_set", subjectType: nameof(Domain.Orders.Order), subjectId: id.ToString(), metadata: new { productId, body.Qty }); return Ok(dto); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/items/{productId}")]
    public async Task<IActionResult> RemoveItem([FromRoute] Guid id, [FromRoute] Guid productId)
    {
        try { var dto = await _svc.RemoveItemAsync(id, productId, HttpContext.RequestAborted); await _audit.LogAsync("order.item_removed", subjectType: nameof(Domain.Orders.Order), subjectId: id.ToString(), metadata: new { productId }); return Ok(dto); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    public sealed record UpdateShippingRequest(string Line1, string? Line2, string City, string State, string PostalCode, string Country = "MX");
    [HttpPut("{id}/shipping")]
    public async Task<IActionResult> UpdateShipping([FromRoute] Guid id, [FromBody] UpdateShippingRequest body)
    {
        try { var dto = await _svc.UpdateShippingAsync(id, body.Line1, body.Line2, body.City, body.State, body.PostalCode, string.IsNullOrWhiteSpace(body.Country) ? "MX" : body.Country, HttpContext.RequestAborted); await _audit.LogAsync("order.shipping_updated", subjectType: nameof(Domain.Orders.Order), subjectId: id.ToString()); return Ok(dto); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    public sealed record SetDiscountRequest(string? Code);
    [HttpPost("{id}/discount")]
    public async Task<IActionResult> SetDiscount([FromRoute] Guid id, [FromBody] SetDiscountRequest body)
    {
        try { var dto = await _svc.SetDiscountAsync(id, body.Code, HttpContext.RequestAborted); await _audit.LogAsync("order.discount_set", subjectType: nameof(Domain.Orders.Order), subjectId: id.ToString(), metadata: new { body.Code }); return Ok(dto); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        try { await _svc.DeleteAsync(id, HttpContext.RequestAborted); await _audit.LogAsync("order.deleted", subjectType: nameof(Domain.Orders.Order), subjectId: id.ToString()); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }
}
