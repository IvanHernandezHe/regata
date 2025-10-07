using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Roue.Application.Interface;
using System.Security.Claims;
using System.Linq;

namespace Roue.API.Controllers;
 
[ApiController]
[Route("api/auth")] // share base with Identity endpoints
public class AuthSessionController : ControllerBase
{
    private readonly IAuditLogger _audit;
    private readonly SignInManager<IdentityUser<Guid>> _signIn;
    private readonly IOptionsMonitor<CookieAuthenticationOptions> _cookieOptions;
    private readonly UserManager<IdentityUser<Guid>> _users;
    public AuthSessionController(IAuditLogger audit, SignInManager<IdentityUser<Guid>> signIn, IOptionsMonitor<CookieAuthenticationOptions> cookieOptions, UserManager<IdentityUser<Guid>> users)
    {
        _audit = audit;
        _signIn = signIn;
        _cookieOptions = cookieOptions;
        _users = users;
    }
    [HttpGet("session")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSession()
    {
        if (User?.Identity?.IsAuthenticated == true)
        {
            var email = User.Claims.FirstOrDefault(c => c.Type.EndsWith("/email", StringComparison.OrdinalIgnoreCase))?.Value
                        ?? User.Identity!.Name
                        ?? string.Empty;
            var isAdmin = User.IsInRole("Admin") || User.Claims.Any(c => c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase) && string.Equals(c.Value, "Admin", StringComparison.OrdinalIgnoreCase));
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? User.FindFirstValue("uid");
            bool? emailConfirmed = null;
            if (!string.IsNullOrWhiteSpace(userId))
            {
                var user = await _users.GetUserAsync(User);
                emailConfirmed = user?.EmailConfirmed;
            }
            return Ok(new { authenticated = true, email, isAdmin, userId, emailConfirmed });
        }
        return Ok(new { authenticated = false, email = (string?)null, isAdmin = false, userId = (string?)null, emailConfirmed = (bool?)null });
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

        // Proactively delete the configured application cookie (e.g. .Roue.Auth)
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
