using Regata.Domain.Products;
using Regata.Domain.Orders;
using Regata.Domain.Marketing;
using Regata.Domain.Carts;
using Regata.Domain.Rewards;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Regata.Infrastructure.Persistence;

// public sealed class AppDbContext
//     : IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>
// {
//     public DbSet<Product> Products => Set<Product>();

//     public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

//     protected override void OnModelCreating(ModelBuilder b)
//     {
//         base.OnModelCreating(b);
//         b.Entity<Product>(e =>
//         {
//             e.HasKey(p => p.Id);
//             e.Property(p => p.Price).HasConversion<double>();
//             e.HasIndex(p => p.Sku).IsUnique();
//         });
//     }
// }


public sealed class AppDbContext : IdentityDbContext<IdentityUser<Guid>, IdentityRole<Guid>, Guid>
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<DiscountCode> DiscountCodes => Set<DiscountCode>();
    public DbSet<RewardAccount> RewardAccounts => Set<RewardAccount>();
    public DbSet<RewardTransaction> RewardTransactions => Set<RewardTransaction>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<Product>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Price).HasConversion<double>();
            e.HasIndex(p => p.Sku).IsUnique();
        });
        b.Entity<Order>(e =>
        {
            e.Property(o => o.Subtotal).HasPrecision(18,2);
            e.Property(o => o.DiscountAmount).HasPrecision(18,2);
            e.Property(o => o.Total).HasPrecision(18,2);
        });
        b.Entity<DiscountCode>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique();
        });
        b.Entity<Cart>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.UserId);
        });
        b.Entity<CartItem>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.UnitPrice).HasPrecision(18,2);
            e.HasOne<Cart>()
                .WithMany(c => c.Items)
                .HasForeignKey(i => i.CartId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
