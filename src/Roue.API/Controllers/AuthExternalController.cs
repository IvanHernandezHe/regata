using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using Roue.Application.Interface;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/auth/external")]
public sealed class AuthExternalController : ControllerBase
{
    private readonly SignInManager<IdentityUser<Guid>> _signInManager;
    private readonly UserManager<IdentityUser<Guid>> _userManager;
    private readonly IConfiguration _cfg;
    private readonly IAuditLogger _audit;
    public AuthExternalController(SignInManager<IdentityUser<Guid>> s, UserManager<IdentityUser<Guid>> u, IConfiguration cfg, IAuditLogger audit)
    { _signInManager = s; _userManager = u; _cfg = cfg; _audit = audit; }

    [HttpGet("{provider}")]
    [AllowAnonymous]
    public IActionResult Challenge([FromRoute] string provider, [FromQuery] string? returnUrl)
    {
        var redirect = Url.ActionLink(nameof(Callback), values: new { returnUrl }) ?? Url.Action(nameof(Callback))!;
        var props = _signInManager.ConfigureExternalAuthenticationProperties(provider, redirect);
        _ = _audit.LogAsync("auth.external_challenge", subjectType: "Provider", subjectId: provider);
        return new ChallengeResult(provider, props);
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromQuery] string? returnUrl)
    {
        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info is null)
        {
            return Redirect(SanitizeReturn(returnUrl) ?? "/auth?login=1");
        }

        var result = await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: true, bypassTwoFactor: true);
        IdentityUser<Guid>? user = null;
        if (result.Succeeded)
        {
            user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
        }
        else
        {
            // create user
            var email = info.Principal.FindFirstValue(ClaimTypes.Email) ?? $"{Guid.NewGuid():n}@external.local";
            user = await _userManager.FindByEmailAsync(email);
            if (user is null)
            {
                user = new IdentityUser<Guid> { UserName = email, Email = email, EmailConfirmed = true };
                await _userManager.CreateAsync(user);
            }
            await _userManager.AddLoginAsync(user, info);
            var displayName = info.Principal.FindFirstValue(ClaimTypes.Name) ?? info.Principal.Identity?.Name;
            if (!string.IsNullOrWhiteSpace(displayName))
            {
                await _userManager.AddClaimAsync(user, new Claim(ClaimTypes.Name, displayName));
            }
            await _signInManager.SignInAsync(user, isPersistent: true);
        }

        await _audit.LogAsync("auth.external_succeeded", subjectType: "User", subjectId: user?.Id.ToString(), metadata: new { info.LoginProvider });
        var target = SanitizeReturn(returnUrl) ?? "/perfil";
        return Redirect(target);
    }

    private string? SanitizeReturn(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl)) return null;
        // allow relative
        if (returnUrl.StartsWith('/')) return returnUrl;
        // allow configured origins
        var allowed = _cfg.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();
        return allowed.Any(o => returnUrl.StartsWith(o, StringComparison.OrdinalIgnoreCase)) ? returnUrl : null;
    }
}
