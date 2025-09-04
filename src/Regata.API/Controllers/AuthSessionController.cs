using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/auth")] // share base with Identity endpoints
public class AuthSessionController : ControllerBase
{
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
}

