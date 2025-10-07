using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Roue.Infrastructure.Integration;

public sealed class WebhookDispatcher
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _cfg;
    private readonly ILogger<WebhookDispatcher> _logger;
    public WebhookDispatcher(IHttpClientFactory httpFactory, IConfiguration cfg, ILogger<WebhookDispatcher> logger)
    { _httpFactory = httpFactory; _cfg = cfg; _logger = logger; }

    public async Task SendAsync(string eventName, object payload, CancellationToken ct = default)
    {
        var url = _cfg["Webhooks:OrderEventsUrl"];
        if (string.IsNullOrWhiteSpace(url)) return; // disabled
        try
        {
            var json = JsonSerializer.Serialize(new { type = eventName, data = payload }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var secret = _cfg["Webhooks:Secret"];
            if (!string.IsNullOrWhiteSpace(secret))
            {
                var sig = ComputeHmacSha256(json, secret);
                content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                content.Headers.Add("X-Signature", sig);
            }
            var client = _httpFactory.CreateClient();
            var resp = await client.PostAsync(url, content, ct);
            _logger.LogInformation("Webhook {Event} -> {Status}", eventName, (int)resp.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Webhook {Event} failed", eventName);
        }
    }

    private static string ComputeHmacSha256(string message, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
