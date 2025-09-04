using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Regata.Infrastructure.Persistence;

namespace Regata.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<IdentityUser<Guid>> _users;
    public OrdersController(AppDbContext db, UserManager<IdentityUser<Guid>> users)
    {
        _db = db; _users = users;
    }

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var userId = user.Id;
        // return minimal history; currently no creation logic implemented
        var list = await _db.Orders.AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Take(20)
            .Select(o => new { o.Id, o.Total, o.Status, o.CreatedAtUtc })
            .ToListAsync();
        return Ok(list);
    }

    public sealed record CheckoutItem(Guid ProductId, int Quantity);
    public sealed record CheckoutRequest(List<CheckoutItem> Items, string? DiscountCode);

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req)
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        // Stub: compute total live without persisting order yet
        var ids = req.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _db.Products.AsNoTracking().Where(p => ids.Contains(p.Id)).ToListAsync();
        var lines = from i in req.Items
                    join p in products on i.ProductId equals p.Id
                    select new { p.Id, p.Brand, p.ModelName, p.Size, UnitPrice = p.Price, i.Quantity, LineTotal = p.Price * i.Quantity };
        var subtotal = lines.Sum(l => l.LineTotal);
        var discount = 0m; // apply discount logic if needed
        var total = subtotal - discount;
        return Ok(new { message = "checkout stub", subtotal, discount, total, currency = "MXN", items = lines });
    }
}

