using System.Text.Json;
using Microsoft.AspNetCore.Http.Extensions;
using Roue.Application.Interface;
using Roue.Domain.Auditing;

namespace Roue.API.Middleware;

public sealed class IdentityAuditMiddleware
{
    private readonly RequestDelegate _next;
    public IdentityAuditMiddleware(RequestDelegate next) { _next = next; }

    public async Task Invoke(HttpContext context, IAuditLogger audit)
    {
        // Intercept Identity API endpoints for login/register to capture failures
        var isLogin = context.Request.Path.Equals("/api/auth/login", StringComparison.OrdinalIgnoreCase);
        var isRegister = context.Request.Path.Equals("/api/auth/register", StringComparison.OrdinalIgnoreCase);

        if (!(isLogin || isRegister))
        {
            await _next(context);
            return;
        }

        // Buffer body to read email for audit in case of failure
        string? email = null;
        try
        {
            context.Request.EnableBuffering();
            using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
            var raw = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;
            if (!string.IsNullOrWhiteSpace(raw))
            {
                using var doc = JsonDocument.Parse(raw);
                if (doc.RootElement.TryGetProperty("email", out var e) && e.ValueKind == JsonValueKind.String)
                    email = e.GetString();
            }
        }
        catch { /* best-effort only */ }

        await _next(context);

        // After execution, if failed, log
        var code = context.Response.StatusCode;
        if (code >= 400)
        {
            var action = isLogin ? "auth.login_failed" : "auth.register_failed";
            await audit.LogAsync(action,
                subjectType: "User",
                subjectId: email,
                description: $"{(isLogin ? "Login" : "Register")} failed with {code}",
                metadata: new { status = code, url = context.Request.GetDisplayUrl() },
                severity: AuditSeverity.Warning,
                ct: context.RequestAborted);
        }
        else if (isRegister)
        {
            // Successful registrations
            await audit.LogAsync("auth.register_succeeded",
                subjectType: "User",
                subjectId: email,
                description: "User registered",
                metadata: null,
                severity: AuditSeverity.Info,
                ct: context.RequestAborted);
        }
    }
}

