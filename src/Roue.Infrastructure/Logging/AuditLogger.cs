using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Roue.Application.Interface;
using Roue.Domain.Auditing;
using Roue.Infrastructure.Persistence;

namespace Roue.Infrastructure.Logging;

public sealed class AuditLogger : IAuditLogger
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpContextAccessor _http;

    public AuditLogger(IServiceScopeFactory scopeFactory, IHttpContextAccessor http)
    { _scopeFactory = scopeFactory; _http = http; }

    public async Task LogAsync(string action, string? subjectType = null, string? subjectId = null, string? description = null, object? metadata = null, CancellationToken ct = default)
        => await LogAsync(action, subjectType, subjectId, description, metadata, AuditSeverity.Info, ct);

    public async Task LogAsync(string action, string? subjectType, string? subjectId, string? description, object? metadata, AuditSeverity severity, CancellationToken ct = default)
    {
        var ctx = _http.HttpContext;
        Guid? userId = null; string? email = null; string? ip = null; string? ua = null; string? path = null; string? method = null; string? correlationId = null;
        if (ctx is not null)
        {
            var uid = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(uid, out var g)) userId = g;
            email = ctx.User.FindFirstValue(ClaimTypes.Email);
            ip = ctx.Connection.RemoteIpAddress?.ToString();
            ua = ctx.Request.Headers.UserAgent.ToString();
            path = ctx.Request.Path.HasValue ? ctx.Request.Path.Value : null;
            method = ctx.Request.Method;
            if (ctx.Items.TryGetValue("correlationId", out var cid) && cid is string s) correlationId = s;
            else correlationId = ctx.TraceIdentifier;
        }

        var log = new AuditLog(action, severity);
        log.WithUser(userId, email);
        log.WithRequest(ip, ua, path, method, correlationId);
        log.WithSubject(subjectType, subjectId);
        log.WithDescription(description);
        if (metadata is not null)
        {
            var json = JsonSerializer.Serialize(metadata, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            log.WithMetadata(json);
        }
        // Use a fresh scoped DbContext to avoid interfering with the request-scoped change tracker
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.AuditLogs.Add(log);
        try { await db.SaveChangesAsync(ct); } catch { /* swallow audit errors */ }
    }
}
