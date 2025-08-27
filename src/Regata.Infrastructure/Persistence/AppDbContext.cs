using Regata.Domain.Products;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Regata.Infrastructure.Persistence;

public sealed class AppDbContext
    : IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>
{
    public DbSet<Product> Products => Set<Product>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<Product>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Price).HasPrecision(18, 2);
            e.HasIndex(p => p.Sku).IsUnique();
        });
    }
}