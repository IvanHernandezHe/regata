using Microsoft.EntityFrameworkCore;
using Roue.Application.DTOs;
using Roue.Application.Interface;
using Roue.Infrastructure.Persistence;

namespace Roue.Infrastructure.Services;

public sealed class AuditQueryService : IAuditQueryService
{
    private readonly AppDbContext _db;
    public AuditQueryService(AppDbContext db) { _db = db; }

    public async Task<PagedResultDto<AuditLogItemDto>> SearchAsync(string? action, Guid? userId, string? email, string? path, DateTime? from, DateTime? to, int page, int pageSize, CancellationToken ct = default)
    {
        var q = _db.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(action)) q = q.Where(a => a.Action == action);
        if (userId.HasValue) q = q.Where(a => a.UserId == userId);
        if (!string.IsNullOrWhiteSpace(email)) q = q.Where(a => a.UserEmail!.Contains(email!));
        if (!string.IsNullOrWhiteSpace(path)) q = q.Where(a => a.Path!.StartsWith(path!));
        if (from.HasValue) q = q.Where(a => a.CreatedAtUtc >= from);
        if (to.HasValue) q = q.Where(a => a.CreatedAtUtc <= to);
        var total = await q.LongCountAsync(ct);
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 500);
        var items = await q.OrderByDescending(a => a.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(a => new AuditLogItemDto(a.Id, a.CreatedAtUtc, a.Action, a.UserId, a.UserEmail, a.Path, a.Method, a.IpAddress, a.CorrelationId, a.SubjectType, a.SubjectId, a.Description, a.MetadataJson))
            .ToListAsync(ct);
        return new PagedResultDto<AuditLogItemDto>(total, page, pageSize, items);
    }

    public async Task<AuditLogItemDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var a = await _db.AuditLogs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (a is null) return null;
        return new AuditLogItemDto(a.Id, a.CreatedAtUtc, a.Action, a.UserId, a.UserEmail, a.Path, a.Method, a.IpAddress, a.CorrelationId, a.SubjectType, a.SubjectId, a.Description, a.MetadataJson);
    }
}

