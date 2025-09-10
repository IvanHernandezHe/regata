using Regata.Domain.Products;
using Regata.Domain.Orders;
using Regata.Domain.Marketing;
using Regata.Domain.Carts;
using Regata.Domain.Rewards;
using Regata.Domain.Wishlist;
using Regata.Domain.Inventory;
using Regata.Domain.Auditing;
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
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<WishlistItem> Wishlist => Set<WishlistItem>();
    public DbSet<InventoryItem> Inventory => Set<InventoryItem>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<InventoryReservation> InventoryReservations => Set<InventoryReservation>();

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
        b.Entity<AuditLog>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Action).HasMaxLength(128);
            e.Property(a => a.UserEmail).HasMaxLength(256);
            e.Property(a => a.IpAddress).HasMaxLength(64);
            e.Property(a => a.UserAgent).HasMaxLength(512);
            e.Property(a => a.Path).HasMaxLength(256);
            e.Property(a => a.Method).HasMaxLength(12);
            e.Property(a => a.CorrelationId).HasMaxLength(64);
            e.Property(a => a.SubjectType).HasMaxLength(64);
            e.Property(a => a.SubjectId).HasMaxLength(64);
            e.HasIndex(a => new { a.CreatedAtUtc });
            e.HasIndex(a => new { a.UserId, a.CreatedAtUtc });
            e.HasIndex(a => a.Action);
        });

        b.Entity<WishlistItem>(e =>
        {
            e.HasKey(w => w.Id);
            e.Property(w => w.Price).HasPrecision(18,2);
            e.HasIndex(w => new { w.UserId, w.ProductId }).IsUnique();
        });

        b.Entity<InventoryItem>(e =>
        {
            e.HasKey(i => i.Id);
            e.HasIndex(i => i.ProductId).IsUnique();
            e.Property(i => i.Version).IsConcurrencyToken();
        });
        b.Entity<InventoryTransaction>(e =>
        {
            e.HasKey(t => t.Id);
            e.HasIndex(t => new { t.ProductId, t.CreatedAtUtc });
        });
        b.Entity<InventoryReservation>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.Token).IsUnique();
            e.HasIndex(r => new { r.ProductId, r.Status, r.ExpiresAtUtc });
        });
    }
}
