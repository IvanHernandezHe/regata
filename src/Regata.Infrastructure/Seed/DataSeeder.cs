using Regata.Domain.Products;
using Regata.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Regata.Domain.Inventory;
using Regata.Domain.Marketing;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace Regata.Infrastructure.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider sp)
    {
        var db = sp.GetRequiredService<AppDbContext>();
        // Seed catalog products (idempotente: solo agrega faltantes por SKU)
        var seeds = new (string sku, string brand, string model, string size, decimal price, int stock)[]
        {
            ("REG-2055516-1", "Regata", "Suntire Street",  "205/55R16", 1899m, 20),
            ("REG-2156516-1", "Regata", "Suntire Touring", "215/65R16", 2599m, 15),
            ("REG-1956515-1", "Regata", "Suntire Eco",     "195/65R15", 1599m, 25),
            ("REG-2254018-1", "Regata", "Suntire Sport",    "225/40R18", 3299m, 10),
            ("REG-2254517-1", "Regata", "Suntire Pro",      "225/45R17", 2899m, 18),
            ("REG-2355018-1", "Regata", "Suntire Pro+",     "235/50R18", 3499m, 8),
            ("REG-2657016-1", "Regata", "Suntire AT",       "265/70R16", 4099m, 12),
            ("REG-2755519-1", "Regata", "Suntire UHP",      "275/55R19", 4699m, 6),
        };
        var existingSkus = await db.Products.AsNoTracking().Select(p => p.Sku).ToListAsync();
        var toAdd = seeds.Where(s => !existingSkus.Contains(s.sku)).ToList();
        if (toAdd.Count > 0)
        {
            foreach (var s in toAdd)
            {
                var p = new Product(s.sku, s.brand, s.model, s.size, s.price);
                // demo specs/images via reflection
                var t = typeof(Product);
                t.GetProperty(nameof(Product.Type))?.SetValue(p, s.size.Contains("R") && s.size.Contains("70") ? "CAMIONETA" : "AUTO");
                t.GetProperty(nameof(Product.LoadIndex))?.SetValue(p, "107(975Kg.)");
                t.GetProperty(nameof(Product.SpeedRating))?.SetValue(p, "H (210Km/hr)");
                var imgs = System.Text.Json.JsonSerializer.Serialize(new[] { "/assets/pzero-1_80.jpg", "/assets/pzero-1_80.jpg", "/assets/pzero-1_80.jpg" });
                t.GetProperty(nameof(Product.ImagesJson))?.SetValue(p, imgs);
                db.Products.Add(p);
            }
            await db.SaveChangesAsync();

            // seed inventory for the newly added products
            foreach (var s in toAdd)
            {
                var p = await db.Products.AsNoTracking().FirstAsync(x => x.Sku == s.sku);
                db.Inventory.Add(new InventoryItem(p.Id, s.stock));
                db.InventoryTransactions.Add(new InventoryTransaction(p.Id, s.stock, InventoryTxnType.Receive, "seed"));
            }
            await db.SaveChangesAsync();
        }

        // Ensure brands table populated and link BrandId on products (idempotente)
        var distinctBrands = await db.Products.AsNoTracking().Select(p => p.Brand).Distinct().ToListAsync();
        foreach (var name in distinctBrands)
        {
            if (string.IsNullOrWhiteSpace(name)) continue;
            var b = await db.Brands.FirstOrDefaultAsync(x => x.Name == name);
            if (b is null)
            {
                b = new Regata.Domain.Products.Brand(name, name.Equals("Regata", StringComparison.OrdinalIgnoreCase) ? "/assets/brand/regata-mark2.svg" : null);
                db.Brands.Add(b);
                await db.SaveChangesAsync();
            }
            // Link products missing BrandId
            await db.Products.Where(p => p.Brand == name && p.BrandId == null).ExecuteUpdateAsync(u => u.SetProperty(x => x.BrandId, b.Id));
        }

        // Ensure default categories and link existing as Llantas
        var tires = await db.ProductCategories.FirstOrDefaultAsync(c => c.Slug == "llantas")
                    ?? (db.ProductCategories.Add(new ProductCategory("Llantas", "llantas")).Entity);
        var rims = await db.ProductCategories.FirstOrDefaultAsync(c => c.Slug == "rines")
                   ?? (db.ProductCategories.Add(new ProductCategory("Rines", "rines")).Entity);
        await db.SaveChangesAsync();
        await db.Products.Where(p => p.CategoryId == null).ExecuteUpdateAsync(u => u.SetProperty(x => x.CategoryId, tires!.Id));

        // Seed demo RIM products if missing
        var rimSeeds = new (string sku, string brand, string model, string size, decimal price, int stock,
                            double dia, double width, string pattern, int offset, double cbore, string material, string finish)[]
        {
            ("RIM-ENK-18X8-5X114.3-45", "Enkei", "TS-5", "18x8 5x114.3 ET45", 3599m, 12, 18, 8, "5x114.3", 45, 66.1, "Aluminio", "Negro satinado"),
            ("RIM-REG-17X7.5-5X112-35", "Regata", "StreetFlow", "17x7.5 5x112 ET35", 2799m, 20, 17, 7.5, "5x112", 35, 66.6, "Aluminio", "Gris"),
        };
        foreach (var r in rimSeeds)
        {
            if (!await db.Products.AnyAsync(p => p.Sku == r.sku))
            {
                var p = new Product(r.sku, r.brand, r.model, r.size, r.price);
                typeof(Product).GetProperty(nameof(Product.ImagesJson))?.SetValue(p, System.Text.Json.JsonSerializer.Serialize(new[] { "/assets/pzero-1_80.jpg" }));
                db.Products.Add(p);
                await db.SaveChangesAsync();
                // Link brand and category
                var brand = await db.Brands.FirstOrDefaultAsync(b => b.Name == r.brand) ?? (db.Brands.Add(new Regata.Domain.Products.Brand(r.brand)).Entity);
                await db.SaveChangesAsync();
                await db.Products.Where(x => x.Id == p.Id).ExecuteUpdateAsync(u => u
                    .SetProperty(x => x.BrandId, brand.Id)
                    .SetProperty(x => x.CategoryId, rims.Id));
                // Create RimSpecs
                db.RimSpecs.Add(new Regata.Domain.Products.RimSpecs(p.Id, r.dia, r.width, r.pattern, r.offset, r.cbore, r.material, r.finish));
                // Inventory
                db.Inventory.Add(new InventoryItem(p.Id, r.stock));
                db.InventoryTransactions.Add(new InventoryTransaction(p.Id, r.stock, InventoryTxnType.Receive, "seed"));
                await db.SaveChangesAsync();
            }
        }

        // Backfill TireSpecs and images for existing products
        var tiresList = await db.Products.AsNoTracking().Select(x => new { x.Id, x.Size }).ToListAsync();
        var existingTireIds = await db.TireSpecs.AsNoTracking().Select(t => t.ProductId).ToListAsync();
        foreach (var p in tiresList)
        {
            if (!existingTireIds.Contains(p.Id))
            {
                db.TireSpecs.Add(new Regata.Domain.Products.TireSpecs(p.Id, "AUTO", "107(975Kg.)", "H (210Km/hr)"));
            }
        }
        await db.SaveChangesAsync();
        var productsNoImages = await db.Products.Where(p => p.ImagesJson == null).ToListAsync();
        foreach (var p in productsNoImages)
        {
            var imgs = System.Text.Json.JsonSerializer.Serialize(new[] { "/assets/pzero-1_80.jpg", "/assets/pzero-1_80.jpg", "/assets/pzero-1_80.jpg" });
            typeof(Product).GetProperty(nameof(Product.ImagesJson))?.SetValue(p, imgs);
        }
        if (productsNoImages.Count > 0) await db.SaveChangesAsync();

        // initialize inventory row for any product that still lacks inventory (0 qty placeholder)
        var missing = await db.Products.AsNoTracking()
            .Where(p => !db.Inventory.Any(i => i.ProductId == p.Id))
            .ToListAsync();
        foreach (var p in missing)
        {
            db.Inventory.Add(new InventoryItem(p.Id, 0));
            db.InventoryTransactions.Add(new InventoryTransaction(p.Id, 0, InventoryTxnType.Adjust, "seed-init"));
        }
        if (missing.Count > 0) await db.SaveChangesAsync();

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

        // Seed demo user with default address (idempotente)
        var demoEmail = cfg["Demo:Email"] ?? "demo@regata.local";
        var demoPassword = cfg["Demo:Password"] ?? "Demo!234";
        var demo = await users.FindByEmailAsync(demoEmail);
        if (demo is null)
        {
            demo = new IdentityUser<Guid> { UserName = demoEmail, Email = demoEmail, EmailConfirmed = true };
            var res = await users.CreateAsync(demo, demoPassword);
            if (!res.Succeeded)
            {
                await users.CreateAsync(demo);
            }
        }
        // Default demo address
        var hasAddr = await db.Addresses.AnyAsync(a => a.UserId == demo.Id);
        if (!hasAddr)
        {
            db.Addresses.Add(new Regata.Domain.Accounts.Address(demo.Id, "Av. Reforma 123", "Depto 4B", "CDMX", "CDMX", "06000", "MX", true));
            await db.SaveChangesAsync();
        }

        // Seed basic discount codes if missing
        if (!await db.DiscountCodes.AsNoTracking().AnyAsync(dc => dc.Code == "REGATA10"))
        {
            var dc = new DiscountCode();
            var t = typeof(DiscountCode);
            t.GetProperty(nameof(DiscountCode.Code))!.SetValue(dc, "REGATA10");
            t.GetProperty(nameof(DiscountCode.Type))!.SetValue(dc, DiscountType.Percentage);
            t.GetProperty(nameof(DiscountCode.Value))!.SetValue(dc, 10m);
            t.GetProperty(nameof(DiscountCode.MaxRedemptions))!.SetValue(dc, 1000);
            t.GetProperty(nameof(DiscountCode.Active))!.SetValue(dc, true);
            t.GetProperty(nameof(DiscountCode.ExpiresAtUtc))!.SetValue(dc, DateTime.UtcNow.AddMonths(6));
            db.DiscountCodes.Add(dc);
        }
        if (!await db.DiscountCodes.AsNoTracking().AnyAsync(dc => dc.Code == "REGATA200"))
        {
            var dc = new DiscountCode();
            var t = typeof(DiscountCode);
            t.GetProperty(nameof(DiscountCode.Code))!.SetValue(dc, "REGATA200");
            t.GetProperty(nameof(DiscountCode.Type))!.SetValue(dc, DiscountType.FixedAmount);
            t.GetProperty(nameof(DiscountCode.Value))!.SetValue(dc, 200m);
            t.GetProperty(nameof(DiscountCode.MaxRedemptions))!.SetValue(dc, 1000);
            t.GetProperty(nameof(DiscountCode.Active))!.SetValue(dc, true);
            t.GetProperty(nameof(DiscountCode.ExpiresAtUtc))!.SetValue(dc, DateTime.UtcNow.AddMonths(6));
            db.DiscountCodes.Add(dc);
        }
        await db.SaveChangesAsync();
    }
}
