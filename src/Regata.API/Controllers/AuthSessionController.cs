using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Regata.Application.Interface;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/auth")] // share base with Identity endpoints
public class AuthSessionController : ControllerBase
{
    private readonly IAuditLogger _audit;
    private readonly SignInManager<IdentityUser<Guid>> _signIn;
    public AuthSessionController(IAuditLogger audit, SignInManager<IdentityUser<Guid>> signIn) { _audit = audit; _signIn = signIn; }
    [HttpGet("session")]
    [AllowAnonymous]
    public IActionResult GetSession()
    {
        if (User?.Identity?.IsAuthenticated == true)
        {
            var email = User.Claims.FirstOrDefault(c => c.Type.EndsWith("/email", StringComparison.OrdinalIgnoreCase))?.Value
                        ?? User.Identity!.Name
                        ?? string.Empty;
            return Ok(new { authenticated = true, email });
        }
        return Ok(new { authenticated = false, email = (string?)null });
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout()
    {
        await _signIn.SignOutAsync();
        await HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);
        await HttpContext.SignOutAsync(IdentityConstants.TwoFactorUserIdScheme);
        Response.Cookies.Delete(".AspNetCore.Identity.Application", new CookieOptions { Path = "/" });
        Response.Cookies.Delete(".AspNetCore.Cookies", new CookieOptions { Path = "/" });
        await _audit.LogAsync("auth.logout", subjectType: "User", subjectId: null, description: "User logged out");
        return NoContent();
    }
}
