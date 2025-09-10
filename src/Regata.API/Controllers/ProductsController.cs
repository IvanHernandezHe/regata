using Regata.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Regata.Domain.Products;
using Regata.Domain.Inventory;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProductsController(AppDbContext db) => _db = db;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get([FromQuery] string? q)
    {
        var now = DateTime.UtcNow;
        var baseQuery = _db.Products.AsNoTracking().Where(p => p.Active);
        if (!string.IsNullOrWhiteSpace(q))
            baseQuery = baseQuery.Where(p => p.Brand.Contains(q) || p.ModelName.Contains(q) || p.Sku.Contains(q));

        var items = await (
            from p in baseQuery
            join i in _db.Inventory.AsNoTracking() on p.Id equals i.ProductId into invJoin
            from inv in invJoin.DefaultIfEmpty()
            let reserved = (_db.InventoryReservations
                .Where(r => r.ProductId == p.Id && r.Status == ReservationStatus.Active && r.ExpiresAtUtc > now)
                .Sum(r => (int?)r.Quantity)) ?? 0
            let onHand = inv == null ? 0 : inv.OnHand
            let stock = (onHand - reserved) < 0 ? 0 : (onHand - reserved)
            orderby p.Brand
            select new { p.Id, p.Sku, p.Brand, p.ModelName, p.Size, p.Price, p.Active, Stock = stock }
        )
        .Take(50)
        .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var now = DateTime.UtcNow;
        var item = await (
            from p in _db.Products.AsNoTracking().Where(x => x.Id == id && x.Active)
            join i in _db.Inventory.AsNoTracking() on p.Id equals i.ProductId into invJoin
            from inv in invJoin.DefaultIfEmpty()
            let reserved = (_db.InventoryReservations
                .Where(r => r.ProductId == p.Id && r.Status == ReservationStatus.Active && r.ExpiresAtUtc > now)
                .Sum(r => (int?)r.Quantity)) ?? 0
            let onHand = inv == null ? 0 : inv.OnHand
            let stock = (onHand - reserved) < 0 ? 0 : (onHand - reserved)
            select new { p.Id, p.Sku, p.Brand, p.ModelName, p.Size, p.Price, p.Active, Stock = stock }
        ).FirstOrDefaultAsync();

        if (item is null) return NotFound();
        return Ok(item);
    }
}
