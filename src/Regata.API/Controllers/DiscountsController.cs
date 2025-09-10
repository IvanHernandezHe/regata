using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Regata.Infrastructure.Persistence;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class DiscountsController : ControllerBase
{
    private readonly AppDbContext _db;
    public DiscountsController(AppDbContext db) => _db = db;

    [HttpGet("validate")]
    [AllowAnonymous]
    public async Task<IActionResult> Validate([FromQuery] string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return BadRequest("code requerido");
        var now = DateTime.UtcNow;
        var dc = await _db.DiscountCodes.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Code == code && x.Active && (!x.ExpiresAtUtc.HasValue || x.ExpiresAtUtc > now) && x.Redemptions < x.MaxRedemptions);
        if (dc is null) return NotFound();
        return Ok(new { dc.Code, dc.Type, dc.Value, dc.ExpiresAtUtc, dc.MaxRedemptions, dc.Redemptions });
    }
}

