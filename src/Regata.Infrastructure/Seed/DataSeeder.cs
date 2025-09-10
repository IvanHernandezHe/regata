using Regata.Domain.Products;
using Regata.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Regata.Domain.Inventory;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace Regata.Infrastructure.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider sp)
    {
        var db = sp.GetRequiredService<AppDbContext>();
        if (!await db.Products.AnyAsync())
        {
            var p1 = new Product("REG-2055516-1", "Regata", "Suntire Street", "205/55R16", 1899m);
            var p2 = new Product("REG-2156516-1", "Regata", "Suntire Touring", "215/65R16", 2599m);
            db.Products.AddRange(p1, p2);
            await db.SaveChangesAsync();

            // seed inventory for demo data
            db.Inventory.Add(new InventoryItem(p1.Id, 20));
            db.Inventory.Add(new InventoryItem(p2.Id, 15));
            db.InventoryTransactions.Add(new InventoryTransaction(p1.Id, 20, InventoryTxnType.Receive, "seed"));
            db.InventoryTransactions.Add(new InventoryTransaction(p2.Id, 15, InventoryTxnType.Receive, "seed"));
            await db.SaveChangesAsync();
        }
        else
        {
            // initialize inventory for existing products without inventory rows
            var missing = await db.Products.AsNoTracking()
                .Where(p => !db.Inventory.Any(i => i.ProductId == p.Id))
                .ToListAsync();
            foreach (var p in missing)
            {
                db.Inventory.Add(new InventoryItem(p.Id, 0));
                db.InventoryTransactions.Add(new InventoryTransaction(p.Id, 0, InventoryTxnType.Adjust, "seed-init"));
            }
            if (missing.Count > 0) await db.SaveChangesAsync();
        }

        // Seed Admin role and user
        var roles = sp.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var users = sp.GetRequiredService<UserManager<IdentityUser<Guid>>>();
        var cfg = sp.GetRequiredService<IConfiguration>();
        var adminRole = "Admin";
        if (!await roles.RoleExistsAsync(adminRole))
        {
            await roles.CreateAsync(new IdentityRole<Guid>(adminRole));
        }
        var email = cfg["Admin:Email"] ?? "admin@regata.local";
        var password = cfg["Admin:Password"] ?? "Admin!234";
        var user = await users.FindByEmailAsync(email);
        if (user is null)
        {
            user = new IdentityUser<Guid> { UserName = email, Email = email, EmailConfirmed = true };
            var res = await users.CreateAsync(user, password);
            if (!res.Succeeded)
            {
                // fallback create without password
                await users.CreateAsync(user);
            }
        }
        if (!await users.IsInRoleAsync(user, adminRole))
        {
            await users.AddToRoleAsync(user, adminRole);
        }
    }
}
