using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Roue.Domain.Products;
using Roue.Infrastructure.Persistence;

namespace Roue.API.Controllers.Admin;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin")]
public sealed class CategoriesAdminController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesAdminController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List() {
        var list = await _db.ProductCategories.AsNoTracking().OrderBy(c => c.Name).Select(c => new { c.Id, c.Name, c.Slug, c.Active }).ToListAsync();
        return Ok(list);
    }

    public sealed record UpsertCategory(Guid? Id, string Name, string Slug, bool Active);

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] UpsertCategory input) {
        if (string.IsNullOrWhiteSpace(input.Name) || string.IsNullOrWhiteSpace(input.Slug)) return BadRequest("Nombre y slug requeridos");
        if (input.Id is null || input.Id == Guid.Empty) {
            var exists = await _db.ProductCategories.AnyAsync(c => c.Slug == input.Slug || c.Name == input.Name);
            if (exists) return Conflict("La categoría ya existe");
            var c = new ProductCategory(input.Name, input.Slug); typeof(ProductCategory).GetProperty("Active")?.SetValue(c, input.Active);
            _db.ProductCategories.Add(c);
        } else {
            var c = await _db.ProductCategories.FirstOrDefaultAsync(c => c.Id == input.Id.Value);
            if (c is null) return NotFound();
            typeof(ProductCategory).GetProperty("Name")?.SetValue(c, input.Name);
            typeof(ProductCategory).GetProperty("Slug")?.SetValue(c, input.Slug);
            typeof(ProductCategory).GetProperty("Active")?.SetValue(c, input.Active);
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

