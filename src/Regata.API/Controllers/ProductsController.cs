using Regata.Application.Interface;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Regata.Domain.Products;
using Regata.Domain.Inventory;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductQueryService _svc;
    public ProductsController(IProductQueryService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get([FromQuery] string? q)
    {
        var items = await _svc.SearchAsync(q, 50, HttpContext.RequestAborted);
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
