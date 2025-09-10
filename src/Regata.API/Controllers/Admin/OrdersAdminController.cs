using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Regata.Domain.Orders;
using Regata.Application.Interface;

namespace Regata.API.Controllers.Admin;

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
        return NoContent();
    }
}
