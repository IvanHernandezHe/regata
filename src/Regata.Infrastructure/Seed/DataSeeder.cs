using System;
using System.Collections.Generic;
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
        var brandCache = new Dictionary<string, Brand>(StringComparer.OrdinalIgnoreCase);

        var brandSeeds = new (Guid Id, string Name, string? LogoUrl, bool Active)[]
        {
            (Guid.Parse("97A097A2-C054-4C68-AF38-8960FB3739AC"), "Regata", "/assets/brand/regata-mark2.png", true),
            (Guid.Parse("0BA11187-712D-40FE-AFBB-2B70F49939A0"), "Enkei", null, true),
            (Guid.Parse("9D8C7B6A-4F1E-42C9-A1D2-3B4E5F6C7D8E"), "CONTINENTAL", "/assets/brand/continental.png", true),
            (Guid.Parse("F2A4D9B1-5E8C-4A31-B96D-7F8E1C0D3A5B"), "COOPER", "/assets/brand/cooper.png", true),
            (Guid.Parse("2A1B3C4D-5E6F-4071-8A9B-C1D2E3F4A5B6"), "DELMAX", "/assets/brand/delmax.png", true),
            (Guid.Parse("8B0D2A7C-3F4E-4E78-8D2B-6C1F5E9A2D3E"), "GOODYEAR", "/assets/brand/goodyear.png", false),
            (Guid.Parse("B7C6D5E4-F3A2-4109-8765-43210FEDCBA9"), "HAIDA", "/assets/brand/haida.png", true),
            (Guid.Parse("C963E6E8-2C2B-42E6-A843-03E54B6099B2"), "HANKOOK", "/assets/brand/hankook.png", false),
            (Guid.Parse("6E1C0D2A-3B4E-4F5C-8D9E-A1B2C3D4E5F6"), "NEXEN", "/assets/brand/nexen.png", false),
            (Guid.Parse("1A5F6E3A-7A13-4C9D-8F83-E02D6B359F1C"), "PIRELLI", "/assets/brand/pirelli.png", true),
            (Guid.Parse("0A1B2C3D-4E5F-4678-90AB-CDEF01234567"), "POWERHUB", "/assets/brand/powerhub.jpg", true),
            (Guid.Parse("1F2E3D4C-5B6A-4789-C0D1-E2F3A4B5C6D7"), "ROADMASTER", "/assets/brand/roadmaster.png", false),
            (Guid.Parse("A7D1C0B3-E5F6-4D2C-9B8A-1F2E3D4C5B6A"), "ROYALBLACK", "/assets/brand/royalblack.png", true),
            (Guid.Parse("E9F8D7C6-5B4A-4321-9E0F-1A2B3C4D5E6F"), "TORNEL", "/assets/brand/tornel.png", false),
            (Guid.Parse("D8C7B6A5-E4F3-4210-9876-543210FEDCBA"), "TORQUE", "/assets/brand/torque.png", true),
            (Guid.Parse("4C3B2A1D-5E6F-4071-8A9B-A0B1C2D3E4F5"), "TOWNHALL", "/assets/brand/townhall.png", true),
        };

        foreach (var seed in brandSeeds)
        {
            var brand = await db.Brands.FirstOrDefaultAsync(b => b.Id == seed.Id)
                        ?? await db.Brands.FirstOrDefaultAsync(b => b.Name == seed.Name);
            if (brand is null)
            {
                brand = new Brand(seed.Name, seed.LogoUrl);
                typeof(Brand).GetProperty(nameof(Brand.Id))?.SetValue(brand, seed.Id);
                db.Brands.Add(brand);
            }
            typeof(Brand).GetProperty(nameof(Brand.Name))?.SetValue(brand, seed.Name);
            typeof(Brand).GetProperty(nameof(Brand.LogoUrl))?.SetValue(brand, seed.LogoUrl);
            typeof(Brand).GetProperty(nameof(Brand.Active))?.SetValue(brand, seed.Active);
            typeof(Brand).GetProperty(nameof(Brand.Id))?.SetValue(brand, seed.Id);
            brandCache[seed.Name] = brand;
        }
        await db.SaveChangesAsync();

        async Task<Brand> EnsureBrandAsync(string name)
        {
            if (brandCache.TryGetValue(name, out var cached)) return cached;
            var brand = await db.Brands.FirstOrDefaultAsync(b => b.Name == name);
            if (brand is null)
            {
                var logo = name.Equals("Regata", StringComparison.OrdinalIgnoreCase) ? "/assets/brand/regata-mark2.svg" : null;
                brand = new Brand(name, logo);
                db.Brands.Add(brand);
                await db.SaveChangesAsync();
            }
            brandCache[name] = brand;
            return brand;
        }

        var tires = await db.ProductCategories.FirstOrDefaultAsync(c => c.Slug == "llantas")
                    ?? (db.ProductCategories.Add(new ProductCategory("Llantas", "llantas")).Entity);
        var rims = await db.ProductCategories.FirstOrDefaultAsync(c => c.Slug == "rines")
                   ?? (db.ProductCategories.Add(new ProductCategory("Rines", "rines")).Entity);
        await db.SaveChangesAsync();

        var existingSkus = new HashSet<string>(await db.Products.AsNoTracking().Select(p => p.Sku).ToListAsync(), StringComparer.OrdinalIgnoreCase);
        var newCatalogItems = false;

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
        foreach (var s in seeds)
        {
            if (existingSkus.Contains(s.sku)) continue;
            var brand = await EnsureBrandAsync(s.brand);
            var product = new Product(s.sku, brand.Id, s.model, s.size, s.price, tires.Id);
            var imgs = System.Text.Json.JsonSerializer.Serialize(new[] { "/assets/pzero-1_80.jpg", "/assets/pzero-1_80.jpg", "/assets/pzero-1_80.jpg" });
            typeof(Product).GetProperty(nameof(Product.ImagesJson))?.SetValue(product, imgs);
            db.Products.Add(product);
            var type = s.size.Contains("R") && s.size.Contains("70") ? "CAMIONETA" : "AUTO";
            db.TireSpecs.Add(new TireSpecs(product.Id, type, "107(975Kg.)", "H (210Km/hr)"));
            db.Inventory.Add(new InventoryItem(product.Id, s.stock));
            db.InventoryTransactions.Add(new InventoryTransaction(product.Id, s.stock, InventoryTxnType.Receive, "seed"));
            existingSkus.Add(s.sku);
            newCatalogItems = true;
        }

        // Seed demo RIM products if missing
        var rimSeeds = new (string sku, string brand, string model, string size, decimal price, int stock,
                            double dia, double width, string pattern, int offset, double cbore, string material, string finish)[]
        {
            ("RIM-ENK-18X8-5X114.3-45", "Enkei", "TS-5", "18x8 5x114.3 ET45", 3599m, 12, 18, 8, "5x114.3", 45, 66.1, "Aluminio", "Negro satinado"),
            ("RIM-REG-17X7.5-5X112-35", "Regata", "StreetFlow", "17x7.5 5x112 ET35", 2799m, 20, 17, 7.5, "5x112", 35, 66.6, "Aluminio", "Gris"),
        };
        foreach (var r in rimSeeds)
        {
            if (existingSkus.Contains(r.sku)) continue;
            var brand = await EnsureBrandAsync(r.brand);
            var product = new Product(r.sku, brand.Id, r.model, r.size, r.price, rims.Id);
            typeof(Product).GetProperty(nameof(Product.ImagesJson))?.SetValue(product, System.Text.Json.JsonSerializer.Serialize(new[] { "/assets/pzero-1_80.jpg" }));
            db.Products.Add(product);
            db.RimSpecs.Add(new RimSpecs(product.Id, r.dia, r.width, r.pattern, r.offset, r.cbore, r.material, r.finish));
            db.Inventory.Add(new InventoryItem(product.Id, r.stock));
            db.InventoryTransactions.Add(new InventoryTransaction(product.Id, r.stock, InventoryTxnType.Receive, "seed"));
            existingSkus.Add(r.sku);
            newCatalogItems = true;
        }

        if (newCatalogItems)
        {
            await db.SaveChangesAsync();
        }

        await db.Products.Where(p => p.CategoryId == null).ExecuteUpdateAsync(u => u.SetProperty(x => x.CategoryId, tires.Id));

        // Backfill TireSpecs and images for existing products
        var rimProductIds = new HashSet<Guid>(await db.RimSpecs.AsNoTracking().Select(r => r.ProductId).ToListAsync());
        var tiresList = await db.Products.AsNoTracking()
            .Where(x => !rimProductIds.Contains(x.Id))
            .Select(x => new { x.Id, x.Size })
            .ToListAsync();
        var existingTireIds = new HashSet<Guid>(await db.TireSpecs.AsNoTracking().Select(t => t.ProductId).ToListAsync());
        var addedSpecs = false;
        foreach (var p in tiresList)
        {
            if (existingTireIds.Contains(p.Id)) continue;
            db.TireSpecs.Add(new TireSpecs(p.Id, "AUTO", "107(975Kg.)", "H (210Km/hr)"));
            addedSpecs = true;
        }
        if (addedSpecs) await db.SaveChangesAsync();
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
