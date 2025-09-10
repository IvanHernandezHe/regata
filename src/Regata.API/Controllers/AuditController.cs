using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Regata.Infrastructure.Persistence;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // consider tightening to Admin-only when roles are in place
public sealed class AuditController : ControllerBase
{
    private readonly AppDbContext _db;
    public AuditController(AppDbContext db) => _db = db;

    public sealed record Query(string? action, Guid? userId, string? email, string? path, DateTime? from, DateTime? to, int page = 1, int pageSize = 50);

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] Query q)
    {
        var query = _db.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q.action)) query = query.Where(a => a.Action == q.action);
        if (q.userId.HasValue) query = query.Where(a => a.UserId == q.userId);
        if (!string.IsNullOrWhiteSpace(q.email)) query = query.Where(a => a.UserEmail!.Contains(q.email!));
        if (!string.IsNullOrWhiteSpace(q.path)) query = query.Where(a => a.Path!.StartsWith(q.path!));
        if (q.from.HasValue) query = query.Where(a => a.CreatedAtUtc >= q.from);
        if (q.to.HasValue) query = query.Where(a => a.CreatedAtUtc <= q.to);

        var total = await query.LongCountAsync();
        var pageSize = Math.Clamp(q.pageSize, 1, 500);
        var page = Math.Max(1, q.page);
        var items = await query
            .OrderByDescending(a => a.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new {
                a.Id,
                a.CreatedAtUtc,
                a.Action,
                a.UserId,
                a.UserEmail,
                a.Path,
                a.Method,
                a.IpAddress,
                a.CorrelationId,
                a.SubjectType,
                a.SubjectId,
                a.Description,
                a.MetadataJson
            })
            .ToListAsync();
        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var a = await _db.AuditLogs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (a is null) return NotFound();
        return Ok(a);
    }
}

