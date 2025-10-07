using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Roue.Application.Interface;

namespace Roue.API.Controllers.Admin;

[ApiController]
[Route("api/admin/inventory")]
[Authorize(Roles = "Admin")]
public sealed class InventoryAdminController : ControllerBase
{
    private readonly IInventoryAdminService _svc;
    private readonly IAuditLogger _audit;
    public InventoryAdminController(IInventoryAdminService svc, IAuditLogger audit) { _svc = svc; _audit = audit; }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid? productId)
    {
        var list = await _svc.ListAsync(productId, HttpContext.RequestAborted);
        return Ok(list);
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> Transactions([FromQuery] Guid? productId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int page=1, [FromQuery] int pageSize=50)
    {
        var res = await _svc.TransactionsAsync(productId, from, to, Math.Max(1, page), Math.Clamp(pageSize, 1, 500), HttpContext.RequestAborted);
        return Ok(res);
    }

    public sealed record AdjustRequest(Guid ProductId, int Delta, string? Reason);
    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] AdjustRequest req)
    {
        await _svc.AdjustAsync(req.ProductId, req.Delta, req.Reason, HttpContext.RequestAborted);
        await _audit.LogAsync("inventory.adjust", subjectType: "Product", subjectId: req.ProductId.ToString(), metadata: new { req.Delta, req.Reason });
        return NoContent();
    }
}
