using Regata.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Authorization;
using Regata.Application.Interface;
using Regata.Infrastructure.Logging;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Regata.Application.Interface;
using Regata.Infrastructure.Inventory;

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
            // Suppress model changes warning for runtime/CLI while we align snapshot
            opt.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
        });

        // Note: For isolated logging, we'll use IServiceScopeFactory to obtain a fresh scoped AppDbContext

        services
            .AddIdentityApiEndpoints<IdentityUser<Guid>>()
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        services.AddHttpContextAccessor();
        services.AddScoped<IAuditLogger, AuditLogger>();
        services.AddScoped<IInventoryService, InventoryService>();

        var authBuilder = services.AddAuthentication();
        var gid = cfg["Authentication:Google:ClientId"];
        var gsec = cfg["Authentication:Google:ClientSecret"];
        if (!string.IsNullOrWhiteSpace(gid) && !string.IsNullOrWhiteSpace(gsec))
        {
            authBuilder.AddGoogle(opts =>
            {
                opts.ClientId = gid; opts.ClientSecret = gsec; opts.SignInScheme = IdentityConstants.ExternalScheme;
            });
        }
        var fid = cfg["Authentication:Facebook:AppId"];
        var fsec = cfg["Authentication:Facebook:AppSecret"];
        if (!string.IsNullOrWhiteSpace(fid) && !string.IsNullOrWhiteSpace(fsec))
        {
            authBuilder.AddFacebook(opts =>
            {
                opts.AppId = fid; opts.AppSecret = fsec; opts.SignInScheme = IdentityConstants.ExternalScheme;
            });
        }
        // Hook cookie events and configure cookie policy (SameSite/Secure) from config
        services.ConfigureApplicationCookie(options =>
        {
            var sameSiteStr = cfg["Auth:CookieSameSite"] ?? "Lax"; // Lax|None|Strict
            var secureStr = cfg["Auth:CookieSecure"] ?? "Conditional"; // Always|None|Conditional
            options.Cookie.Name = ".Regata.Auth";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = sameSiteStr.Equals("None", StringComparison.OrdinalIgnoreCase) ? SameSiteMode.None
                : sameSiteStr.Equals("Strict", StringComparison.OrdinalIgnoreCase) ? SameSiteMode.Strict
                : SameSiteMode.Lax;
            options.Cookie.SecurePolicy = secureStr.Equals("Always", StringComparison.OrdinalIgnoreCase)
                ? CookieSecurePolicy.Always
                : secureStr.Equals("None", StringComparison.OrdinalIgnoreCase) ? CookieSecurePolicy.None : CookieSecurePolicy.SameAsRequest;

            options.Events = new CookieAuthenticationEvents
            {
                OnSignedIn = async ctx =>
                {
                    var audit = ctx.HttpContext.RequestServices.GetRequiredService<IAuditLogger>();
                    await audit.LogAsync("auth.signed_in", subjectType: "User", subjectId: ctx.Principal?.Identity?.Name, description: "User signed in");
                },
                OnSigningOut = async ctx =>
                {
                    var audit = ctx.HttpContext.RequestServices.GetRequiredService<IAuditLogger>();
                    await audit.LogAsync("auth.signed_out", subjectType: "User", description: "User signed out");
                }
            };
        });
        services.AddAuthorization();

        return services;
    }
}
