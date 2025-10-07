using Roue.Application.Interface;
using Roue.Domain.Auditing;

namespace Roue.API.Middleware;

public sealed class ExceptionLoggingMiddleware
{
    private readonly RequestDelegate _next;
    public ExceptionLoggingMiddleware(RequestDelegate next) { _next = next; }

    public async Task Invoke(HttpContext context, IAuditLogger audit)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await audit.LogAsync("error.unhandled",
                subjectType: null,
                subjectId: null,
                description: ex.Message,
                metadata: new { exception = ex.GetType().FullName, stack = ex.StackTrace },
                severity: AuditSeverity.Error,
                ct: context.RequestAborted);
            throw;
        }
    }
}

