using Regata.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

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
        var query = _db.Products.AsNoTracking().Where(p => p.Active);
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(p => p.Brand.Contains(q) || p.ModelName.Contains(q) || p.Sku.Contains(q));
        var items = await query.OrderBy(p => p.Brand).Take(50).ToListAsync();
        return Ok(items);
    }
}