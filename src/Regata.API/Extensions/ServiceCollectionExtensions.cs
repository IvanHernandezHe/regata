using Regata.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Regata.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration cfg)
    {
        var provider = cfg.GetSection("Database")["Provider"] ?? "Postgres";
        var cs = cfg.GetSection("Database")["ConnectionString"] ?? "";

        services.AddDbContext<AppDbContext>(opt =>
        {
            if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
                opt.UseSqlServer(cs);
            else
                opt.UseNpgsql(cs);
        });

        services
            .AddIdentityApiEndpoints<IdentityUser<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        return services;
    }
}