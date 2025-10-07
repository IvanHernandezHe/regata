using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Roue.Application.DTOs;
using Roue.Application.Interface;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class AuditController : ControllerBase
{
    private readonly IAuditQueryService _svc;
    public AuditController(IAuditQueryService svc) => _svc = svc;

    public sealed record Query(string? action, Guid? userId, string? email, string? path, DateTime? from, DateTime? to, int page = 1, int pageSize = 50);

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] Query q)
    {
        var pageSize = Math.Clamp(q.pageSize, 1, 500);
        var page = Math.Max(1, q.page);
        var res = await _svc.SearchAsync(q.action, q.userId, q.email, q.path, q.from, q.to, page, pageSize, HttpContext.RequestAborted);
        return Ok(res);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var a = await _svc.GetByIdAsync(id, HttpContext.RequestAborted);
        if (a is null) return NotFound();
        return Ok(a);
    }
}
