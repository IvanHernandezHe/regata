namespace Roue.API.Middleware;

public sealed class CorrelationIdMiddleware
{
    private const string HeaderName = "X-Correlation-ID";
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next) { _next = next; }

    public async Task Invoke(HttpContext context)
    {
        var id = context.Request.Headers.TryGetValue(HeaderName, out var v) && !string.IsNullOrWhiteSpace(v)
            ? v.ToString()
            : Guid.NewGuid().ToString("n");
        context.Items["correlationId"] = id;
        context.Response.OnStarting(() => { context.Response.Headers[HeaderName] = id; return Task.CompletedTask; });
        await _next(context);
    }
}

