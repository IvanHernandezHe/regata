using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Roue.Infrastructure.Persistence;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public sealed class BrandsController : ControllerBase
{
    private readonly AppDbContext _db;
    public BrandsController(AppDbContext db) { _db = db; }

    public sealed record BrandDto(Guid Id, string Name, string? LogoUrl, bool Active);

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BrandDto>>> ListAsync(CancellationToken ct)
    {
        var items = await _db.Brands.AsNoTracking()
            .OrderByDescending(b => b.Active)
            .ThenBy(b => b.Name)
            .Select(b => new BrandDto(b.Id, b.Name, b.LogoUrl, b.Active))
            .ToListAsync(ct);
        return Ok(items);
    }
}
