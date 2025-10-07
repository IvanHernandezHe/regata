using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Roue.Application.DTOs;
using Roue.Infrastructure.Persistence;
using Roue.Infrastructure.Services;
using Roue.Infrastructure.Inventory;
using Xunit;
using Microsoft.Extensions.Configuration;

public class OrdersServiceTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    [Fact]
    public async Task Quote_Computes_Totals_With_Shipping()
    {
        using var db = CreateDb();
        var inventory = new InventoryService(db);
        var shipping = new Roue.Infrastructure.Services.DefaultShippingCalculator(new ConfigurationBuilder().Build());
        var sut = new OrdersService(db, inventory, shipping);

        // Seed product
        var brand = new Roue.Domain.Products.Brand("Brand");
        db.Brands.Add(brand);
        await db.SaveChangesAsync();
        var p = new Roue.Domain.Products.Product("SKU-1", brand.Id, "Model", "205/55R16", 1000m);
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
        using var db = CreateDb();
        var inventory = new InventoryService(db);
        var shipping = new Roue.Infrastructure.Services.DefaultShippingCalculator(new ConfigurationBuilder().Build());
        var sut = new OrdersService(db, inventory, shipping);

        // Seed product and address
        var brand = new Roue.Domain.Products.Brand("Brand");
        db.Brands.Add(brand);
        await db.SaveChangesAsync();
        var p = new Roue.Domain.Products.Product("SKU-2", brand.Id, "Model", "205/55R16", 1500m);
        db.Products.Add(p);
        await db.SaveChangesAsync();

        var userId = Guid.NewGuid();
        db.Addresses.Add(new Roue.Domain.Accounts.Address(userId, "Calle 1", null, "CDMX", "CDMX", "01000", "MX", true));
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
