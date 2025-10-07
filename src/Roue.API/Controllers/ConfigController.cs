using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ConfigController : ControllerBase
{
    private readonly IConfiguration _cfg;
    private readonly IWebHostEnvironment _env;
    public ConfigController(IConfiguration cfg, IWebHostEnvironment env) { _cfg = cfg; _env = env; }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get()
    {
        var configuredProvider = _cfg["Payments:Provider"] ?? "Sandbox";
        var publishableKey = _cfg["Stripe:PublishableKey"] ?? string.Empty;
        var stripeApiKey = _cfg["Stripe:ApiKey"] ?? string.Empty;
        var stripeConfigured = !string.IsNullOrWhiteSpace(stripeApiKey) && !stripeApiKey.Contains("REEMPLAZA", StringComparison.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(publishableKey) || publishableKey.Contains("REEMPLAZA", StringComparison.OrdinalIgnoreCase))
        {
            publishableKey = string.Empty;
            stripeConfigured = false;
        }
        var provider = configuredProvider.Equals("Stripe", StringComparison.OrdinalIgnoreCase) && !stripeConfigured ? "Sandbox" : configuredProvider;
        var googleEnabled = !string.IsNullOrWhiteSpace(_cfg["Authentication:Google:ClientId"]) && !string.IsNullOrWhiteSpace(_cfg["Authentication:Google:ClientSecret"]);
        var facebookEnabled = !string.IsNullOrWhiteSpace(_cfg["Authentication:Facebook:AppId"]) && !string.IsNullOrWhiteSpace(_cfg["Authentication:Facebook:AppSecret"]);
        return Ok(new
        {
            env = _env.EnvironmentName,
            payments = new
            {
                provider,
                stripe = new { publishableKey, configured = stripeConfigured }
            },
            auth = new { googleEnabled, facebookEnabled }
        });
    }
}
