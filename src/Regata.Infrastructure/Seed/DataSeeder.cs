using Regata.Domain.Products;
using Regata.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Regata.Infrastructure.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (!await db.Products.AnyAsync())
        {
            db.Products.AddRange(
                new Product("REG-2055516-1", "Regata", "Suntire Street", "205/55R16", 1899m, 20),
                new Product("REG-2156516-1", "Regata", "Suntire Touring", "215/65R16", 2599m, 15)
            );
            await db.SaveChangesAsync();
        }
    }
}