using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Roue.Infrastructure.Persistence;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class HealthController : ControllerBase
{
    private readonly AppDbContext _db;
    public HealthController(AppDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            await _db.Database.ExecuteSqlRawAsync("SELECT 1");
            return Ok(new { status = "ok", db = "ok" });
        }
        catch
        {
            return StatusCode(503, new { status = "degraded", db = "failed" });
        }
    }
}

