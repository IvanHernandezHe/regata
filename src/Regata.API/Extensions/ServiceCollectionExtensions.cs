using Regata.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Regata.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration cfg)
    {
        var provider = cfg.GetSection("Database")["Provider"] ?? "Sqlite";
        var cs = cfg.GetSection("Database")["ConnectionString"] ?? "Data Source=./AppData/regata.db";

        services.AddDbContext<AppDbContext>(opt =>
        {
            if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
                opt.UseSqlServer(cs);
            else if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
                opt.UseSqlite(cs);
            else
                opt.UseSqlite(cs); // fallback seguro a Sqlite
        });

        services
            .AddIdentityApiEndpoints<IdentityUser<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        return services;
    }
}