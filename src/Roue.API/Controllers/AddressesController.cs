using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Roue.Application.DTOs;
using Roue.Application.Interface;

namespace Roue.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class AddressesController : ControllerBase
{
    private readonly UserManager<IdentityUser<Guid>> _users;
    private readonly IAddressService _svc;
    public AddressesController(UserManager<IdentityUser<Guid>> users, IAddressService svc)
    { _users = users; _svc = svc; }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var list = await _svc.ListAsync(user.Id, HttpContext.RequestAborted);
        return Ok(list);
    }

    public sealed record UpsertAddress(string Line1, string? Line2, string City, string State, string PostalCode, string Country = "MX", bool IsDefault = false);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertAddress body)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(body.Line1) || string.IsNullOrWhiteSpace(body.City) || string.IsNullOrWhiteSpace(body.State) || string.IsNullOrWhiteSpace(body.PostalCode))
            return BadRequest("Datos incompletos");
        var id = await _svc.CreateAsync(user.Id, new UpsertAddressDto(body.Line1, body.Line2, body.City, body.State, body.PostalCode, body.Country ?? "MX", body.IsDefault), HttpContext.RequestAborted);
        return CreatedAtAction(nameof(List), new { id }, new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpsertAddress body)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        try { await _svc.UpdateAsync(user.Id, id, new UpsertAddressDto(body.Line1, body.Line2, body.City, body.State, body.PostalCode, body.Country ?? "MX", body.IsDefault), HttpContext.RequestAborted); }
        catch (KeyNotFoundException) { return NotFound(); }
        return NoContent();
    }

    [HttpPost("{id}/default")]
    public async Task<IActionResult> SetDefault([FromRoute] Guid id)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        try { await _svc.SetDefaultAsync(user.Id, id, HttpContext.RequestAborted); }
        catch (KeyNotFoundException) { return NotFound(); }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        try { await _svc.DeleteAsync(user.Id, id, HttpContext.RequestAborted); }
        catch (KeyNotFoundException) { return NotFound(); }
        return NoContent();
    }
}
