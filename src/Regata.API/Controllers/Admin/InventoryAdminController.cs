using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Regata.Infrastructure.Persistence;
using Regata.Domain.Inventory;
using Regata.Application.Interface;

namespace Regata.API.Controllers.Admin;

[ApiController]
[Route("api/admin/inventory")]
[Authorize(Roles = "Admin")]
public sealed class InventoryAdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;
    public InventoryAdminController(AppDbContext db, IAuditLogger audit) { _db = db; _audit = audit; }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid? productId)
    {
        var q = _db.Inventory.AsNoTracking().AsQueryable();
        if (productId.HasValue) q = q.Where(i => i.ProductId == productId.Value);
        var list = await q
            .Join(_db.Products.AsNoTracking(), i => i.ProductId, p => p.Id,
                  (i, p) => new { p.Id, p.Sku, p.Brand, p.ModelName, p.Size, i.OnHand, i.Reserved, i.Version })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> Transactions([FromQuery] Guid? productId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int page=1, [FromQuery] int pageSize=50)
    {
        var q = _db.InventoryTransactions.AsNoTracking().AsQueryable();
        if (productId.HasValue) q = q.Where(t => t.ProductId == productId.Value);
        if (from.HasValue) q = q.Where(t => t.CreatedAtUtc >= from.Value);
        if (to.HasValue) q = q.Where(t => t.CreatedAtUtc <= to.Value);
        var total = await q.LongCountAsync();
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 500);
        var items = await q.OrderByDescending(t => t.CreatedAtUtc)
            .Skip((page-1)*pageSize).Take(pageSize)
            .Select(t => new { t.Id, t.ProductId, t.Quantity, t.Type, t.Reference, t.CreatedAtUtc })
            .ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    public sealed record AdjustRequest(Guid ProductId, int Delta, string? Reason);
    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] AdjustRequest req)
    {
        var inv = await _db.Inventory.FirstOrDefaultAsync(i => i.ProductId == req.ProductId);
        if (inv is null) { inv = new InventoryItem(req.ProductId, 0); _db.Inventory.Add(inv); }
        inv.Adjust(req.Delta);
        _db.InventoryTransactions.Add(new InventoryTransaction(req.ProductId, req.Delta, InventoryTxnType.Adjust, req.Reason ?? "manual"));
        await _db.SaveChangesAsync();
        await _audit.LogAsync("inventory.adjust", subjectType: "Product", subjectId: req.ProductId.ToString(), metadata: new { req.Delta, req.Reason });
        return NoContent();
    }
}
