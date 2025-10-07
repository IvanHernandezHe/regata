using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Roue.Domain.Products;
using Roue.Infrastructure.Persistence;

namespace Roue.API.Controllers.Admin;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin")]
public sealed class ProductsAdminController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProductsAdminController(AppDbContext db) { _db = db; }

    [HttpGet("{id:guid}/tire")]
    public async Task<IActionResult> GetTire([FromRoute] Guid id)
    {
        var ts = await _db.TireSpecs.AsNoTracking().FirstOrDefaultAsync(t => t.ProductId == id);
        if (ts is null) return NotFound();
        return Ok(new { ts.ProductId, ts.Type, ts.LoadIndex, ts.SpeedRating });
    }
    public sealed record TireInput(string? Type, string? LoadIndex, string? SpeedRating);
    [HttpPost("{id:guid}/tire")]
    public async Task<IActionResult> UpsertTire([FromRoute] Guid id, [FromBody] TireInput input)
    {
        var ts = await _db.TireSpecs.FirstOrDefaultAsync(t => t.ProductId == id);
        if (ts is null)
        {
            ts = new TireSpecs(id, input.Type, input.LoadIndex, input.SpeedRating);
            _db.TireSpecs.Add(ts);
        }
        else
        {
            typeof(TireSpecs).GetProperty(nameof(TireSpecs.Type))?.SetValue(ts, input.Type);
            typeof(TireSpecs).GetProperty(nameof(TireSpecs.LoadIndex))?.SetValue(ts, input.LoadIndex);
            typeof(TireSpecs).GetProperty(nameof(TireSpecs.SpeedRating))?.SetValue(ts, input.SpeedRating);
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/rim")]
    public async Task<IActionResult> GetRim([FromRoute] Guid id)
    {
        var rs = await _db.RimSpecs.AsNoTracking().FirstOrDefaultAsync(r => r.ProductId == id);
        if (rs is null) return NotFound();
        return Ok(new { rs.ProductId, rs.DiameterIn, rs.WidthIn, rs.BoltPattern, rs.OffsetMm, rs.CenterBoreMm, rs.Material, rs.Finish });
    }
    public sealed record RimInput(double? DiameterIn, double? WidthIn, string? BoltPattern, int? OffsetMm, double? CenterBoreMm, string? Material, string? Finish);
    [HttpPost("{id:guid}/rim")]
    public async Task<IActionResult> UpsertRim([FromRoute] Guid id, [FromBody] RimInput input)
    {
        var rs = await _db.RimSpecs.FirstOrDefaultAsync(r => r.ProductId == id);
        if (rs is null)
        {
            rs = new RimSpecs(id, input.DiameterIn, input.WidthIn, input.BoltPattern, input.OffsetMm, input.CenterBoreMm, input.Material, input.Finish);
            _db.RimSpecs.Add(rs);
        }
        else
        {
            typeof(RimSpecs).GetProperty(nameof(RimSpecs.DiameterIn))?.SetValue(rs, input.DiameterIn);
            typeof(RimSpecs).GetProperty(nameof(RimSpecs.WidthIn))?.SetValue(rs, input.WidthIn);
            typeof(RimSpecs).GetProperty(nameof(RimSpecs.BoltPattern))?.SetValue(rs, input.BoltPattern);
            typeof(RimSpecs).GetProperty(nameof(RimSpecs.OffsetMm))?.SetValue(rs, input.OffsetMm);
            typeof(RimSpecs).GetProperty(nameof(RimSpecs.CenterBoreMm))?.SetValue(rs, input.CenterBoreMm);
            typeof(RimSpecs).GetProperty(nameof(RimSpecs.Material))?.SetValue(rs, input.Material);
            typeof(RimSpecs).GetProperty(nameof(RimSpecs.Finish))?.SetValue(rs, input.Finish);
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

