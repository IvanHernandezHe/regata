using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Regata.Application.Interface;

namespace Regata.API.Controllers;
 
[ApiController]
[Route("api/auth")] // share base with Identity endpoints
public class AuthSessionController : ControllerBase
{
    private readonly IAuditLogger _audit;
    private readonly SignInManager<IdentityUser<Guid>> _signIn;
    private readonly IOptionsMonitor<CookieAuthenticationOptions> _cookieOptions;
    public AuthSessionController(IAuditLogger audit, SignInManager<IdentityUser<Guid>> signIn, IOptionsMonitor<CookieAuthenticationOptions> cookieOptions)
    {
        _audit = audit;
        _signIn = signIn;
        _cookieOptions = cookieOptions;
    }
    [HttpGet("session")]
    [AllowAnonymous]
    public IActionResult GetSession()
    {
        if (User?.Identity?.IsAuthenticated == true)
        {
            var email = User.Claims.FirstOrDefault(c => c.Type.EndsWith("/email", StringComparison.OrdinalIgnoreCase))?.Value
                        ?? User.Identity!.Name
                        ?? string.Empty;
            var isAdmin = User.IsInRole("Admin") || User.Claims.Any(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) && string.Equals(c.Value, "Admin", StringComparison.OrdinalIgnoreCase));
            return Ok(new { authenticated = true, email, isAdmin });
        }
        return Ok(new { authenticated = false, email = (string?)null, isAdmin = false });
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout()
    {
        // Sign out of all known schemes
        await _signIn.SignOutAsync();
        await HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
        await HttpContext.SignOutAsync(IdentityConstants.TwoFactorUserIdScheme);

        // Proactively delete the configured application cookie (e.g. .Regata.Auth)
        var appCookieOpts = _cookieOptions.Get(IdentityConstants.ApplicationScheme);
        var appCookieName = appCookieOpts?.Cookie?.Name;
        if (!string.IsNullOrWhiteSpace(appCookieName) && appCookieOpts?.Cookie != null)
        {
            var deleteOpts = new CookieOptions
            {
                Path = appCookieOpts.Cookie.Path ?? "/",
                Domain = appCookieOpts.Cookie.Domain
            };
            Response.Cookies.Delete(appCookieName!, deleteOpts);
        }

        // Also attempt to delete common defaults just in case
        Response.Cookies.Delete(".AspNetCore.Identity.Application", new CookieOptions { Path = "/" });
        Response.Cookies.Delete(".AspNetCore.Cookies", new CookieOptions { Path = "/" });

        await _audit.LogAsync("auth.logout", subjectType: "User", subjectId: null, description: "User logged out");
        return NoContent();
    }
}
