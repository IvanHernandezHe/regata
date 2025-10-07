using Microsoft.AspNetCore.Mvc;
using Roue.Application.Interface;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class DiscountsController : ControllerBase
{
    private readonly IDiscountsService _svc;
    public DiscountsController(IDiscountsService svc) { _svc = svc; }

    [HttpGet("validate")]
    public async Task<IActionResult> Validate([FromQuery] string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return BadRequest();
        var dto = await _svc.ValidateAsync(code, HttpContext.RequestAborted);
        if (dto is null) return NotFound();
        return Ok(dto);
    }
}
