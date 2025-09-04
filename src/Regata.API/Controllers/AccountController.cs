using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class AccountController : ControllerBase
{
    private readonly UserManager<IdentityUser<Guid>> _users;
    public AccountController(UserManager<IdentityUser<Guid>> users) => _users = users;

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var claims = await _users.GetClaimsAsync(user);
        var displayName = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
        return Ok(new { id = user.Id, email = user.Email, phoneNumber = user.PhoneNumber, emailConfirmed = user.EmailConfirmed, displayName });
    }

    public sealed record UpdateProfileRequest(string? PhoneNumber, string? DisplayName);

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();

        if (!string.IsNullOrWhiteSpace(req.PhoneNumber))
        {
            user.PhoneNumber = req.PhoneNumber;
        }
        var result = await _users.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        if (req.DisplayName is not null)
        {
            var claims = await _users.GetClaimsAsync(user);
            var nameClaim = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name);
            if (nameClaim is not null)
            {
                await _users.RemoveClaimAsync(user, nameClaim);
            }
            if (!string.IsNullOrWhiteSpace(req.DisplayName))
            {
                await _users.AddClaimAsync(user, new Claim(ClaimTypes.Name, req.DisplayName));
            }
        }

        return NoContent();
    }

    public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var result = await _users.ChangePasswordAsync(user, req.CurrentPassword, req.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }
        return NoContent();
    }
}
