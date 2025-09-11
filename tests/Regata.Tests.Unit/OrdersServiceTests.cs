using System.Data.Common;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Regata.Application.DTOs;
using Regata.Infrastructure.Persistence;
using Regata.Infrastructure.Services;
using Regata.Infrastructure.Inventory;
using Xunit;
using Microsoft.Extensions.Configuration;

public class OrdersServiceTests
{
    private static AppDbContext CreateDb(out DbConnection conn)
    {
        conn = new SqliteConnection("DataSource=:memory:");
        conn.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).Options;
        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    [Fact]
    public async Task Quote_Computes_Totals_With_Shipping()
    {
        using var db = CreateDb(out var conn);
        var inventory = new InventoryService(db);
        var shipping = new Regata.Infrastructure.Services.DefaultShippingCalculator(new ConfigurationBuilder().Build());
        var sut = new OrdersService(db, inventory, shipping);

        // Seed product
        var p = new Regata.Domain.Products.Product("SKU-1", "Brand", "Model", "205/55R16", 1000m);
        db.Products.Add(p);
        await db.SaveChangesAsync();

        var items = new List<CheckoutLineDto> { new(p.Id, 2) };
        var quote = await sut.QuoteAsync(items, null);

        Assert.Equal(2000m, quote.Subtotal);
        Assert.Equal(0m, quote.Discount);
        Assert.Equal(99m, quote.Shipping); // below 5000 => shipping applied
        Assert.Equal(2099m, quote.Total);
    }

    [Fact]
    public async Task Checkout_Creates_Order_And_Items()
    {
        using var db = CreateDb(out var conn);
        var inventory = new InventoryService(db);
        var shipping = new Regata.Infrastructure.Services.DefaultShippingCalculator(new ConfigurationBuilder().Build());
        var sut = new OrdersService(db, inventory, shipping);

        // Seed product and address
        var p = new Regata.Domain.Products.Product("SKU-2", "Brand", "Model", "205/55R16", 1500m);
        db.Products.Add(p);
        await db.SaveChangesAsync();

        var userId = Guid.NewGuid();
        db.Addresses.Add(new Regata.Domain.Accounts.Address(userId, "Calle 1", null, "CDMX", "CDMX", "01000", "MX", true));
        await db.SaveChangesAsync();
        var addrId = (await db.Addresses.AsNoTracking().FirstAsync()).Id;

        var items = new List<CheckoutLineDto> { new(p.Id, 3) };
        var res = await sut.CheckoutAsync(userId, items, null, addrId, null);

        Assert.NotEqual(Guid.Empty, res.OrderId);
        var order = await db.Orders.Include(o => o.Items).FirstAsync(o => o.Id == res.OrderId);
        Assert.Single(order.Items);
        Assert.Equal(4500m + 99m, order.Total); // shipping applies under 5000
    }
}
