using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Roue.Domain.Products;
using Roue.Infrastructure.Persistence;

namespace Roue.API.Controllers.Admin;

[ApiController]
[Route("api/admin/brands")]
[Authorize(Roles = "Admin")]
public sealed class BrandsAdminController : ControllerBase
{
    private readonly AppDbContext _db;
    public BrandsAdminController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> List() {
        var list = await _db.Brands.AsNoTracking().OrderBy(b => b.Name).Select(b => new { b.Id, b.Name, b.LogoUrl, b.Active }).ToListAsync();
        return Ok(list);
    }

    public sealed record UpsertBrand(Guid? Id, string Name, string? LogoUrl, bool Active);

    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] UpsertBrand input) {
        if (string.IsNullOrWhiteSpace(input.Name)) return BadRequest("Nombre requerido");
        if (input.Id is null || input.Id == Guid.Empty) {
            var exists = await _db.Brands.AnyAsync(b => b.Name == input.Name);
            if (exists) return Conflict("La marca ya existe");
            var b = new Brand(input.Name, input.LogoUrl); typeof(Brand).GetProperty("Active")?.SetValue(b, input.Active);
            _db.Brands.Add(b);
        } else {
            var b = await _db.Brands.FirstOrDefaultAsync(b => b.Id == input.Id.Value);
            if (b is null) return NotFound();
            typeof(Brand).GetProperty("Name")?.SetValue(b, input.Name);
            typeof(Brand).GetProperty("LogoUrl")?.SetValue(b, input.LogoUrl);
            typeof(Brand).GetProperty("Active")?.SetValue(b, input.Active);
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

