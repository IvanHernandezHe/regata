using Roue.Application.Interface;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Roue.Domain.Products;
using Roue.Domain.Inventory;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductQueryService _svc;
    public ProductsController(IProductQueryService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get([FromQuery] string? q, [FromQuery] string? category)
    {
        var items = await _svc.SearchAsync(q, category, 50, HttpContext.RequestAborted);
        return Ok(items);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var item = await _svc.GetByIdAsync(id, HttpContext.RequestAborted);
        if (item is null) return NotFound();
        return Ok(item);
    }
}
