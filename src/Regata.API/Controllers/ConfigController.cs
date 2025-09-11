using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Regata.API.Controllers;

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
        var provider = _cfg["Payments:Provider"] ?? "Sandbox";
        var googleEnabled = !string.IsNullOrWhiteSpace(_cfg["Authentication:Google:ClientId"]) && !string.IsNullOrWhiteSpace(_cfg["Authentication:Google:ClientSecret"]);
        var facebookEnabled = !string.IsNullOrWhiteSpace(_cfg["Authentication:Facebook:AppId"]) && !string.IsNullOrWhiteSpace(_cfg["Authentication:Facebook:AppSecret"]);
        return Ok(new
        {
            env = _env.EnvironmentName,
            payments = new { provider },
            auth = new { googleEnabled, facebookEnabled }
        });
    }
}

