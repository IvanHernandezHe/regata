using System;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Regata.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Authorization;
using Regata.Application.Interface;
using Regata.Infrastructure.Services;
using Regata.Infrastructure.Logging;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity.UI.Services;
using Regata.Infrastructure.Inventory;
using Regata.Infrastructure.Messaging;
using Regata.Infrastructure.Integration;

namespace Regata.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration cfg)
    {
        var dbSection = cfg.GetSection("Database");
        var provider = dbSection["Provider"] ?? "CosmosPostgres";
        var poolSize = int.TryParse(dbSection["PoolSize"], out var parsedPool) && parsedPool > 0 ? parsedPool : 256;

        services.AddDbContextPool<AppDbContext>((sp, opt) =>
        {
            if (provider.Equals("CosmosPostgres", StringComparison.OrdinalIgnoreCase) || provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
            {
                var cs = BuildNpgsqlConnectionString(dbSection);

                opt.UseNpgsql(cs, npgsql =>
                {
                    var schema = dbSection["Schema"]
                                 ?? Environment.GetEnvironmentVariable("DATABASE_SCHEMA");
                    if (!string.IsNullOrWhiteSpace(schema))
                    {
                        npgsql.MigrationsHistoryTable("__EFMigrationsHistory", schema);
                    }
                    if (int.TryParse(dbSection["CommandTimeoutSeconds"], out var timeout) && timeout > 0)
                    {
                        npgsql.CommandTimeout(timeout);
                    }
                    npgsql.EnableRetryOnFailure(
                        maxRetryCount: int.TryParse(dbSection["MaxRetryCount"], out var retries) && retries >= 0 ? retries : 5,
                        maxRetryDelay: TimeSpan.FromSeconds(double.TryParse(dbSection["MaxRetryDelaySeconds"], out var delay) && delay > 0 ? delay : 10),
                        errorCodesToAdd: null);
                });
                opt.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
                opt.EnableThreadSafetyChecks(false);
            }
            else
            {
                throw new NotSupportedException($"Database provider '{provider}' is no longer supported. Please use 'CosmosPostgres'.");
            }
        }, poolSize);

        // Note: For isolated logging, we'll use IServiceScopeFactory to obtain a fresh scoped AppDbContext

        services
            .AddIdentityApiEndpoints<IdentityUser<Guid>>()
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        services.AddHttpContextAccessor();
        services.AddScoped<IAuditLogger, AuditLogger>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IProductQueryService, ProductQueryService>();
        services.AddScoped<IAddressService, AddressService>();
        services.AddScoped<IDiscountsService, DiscountsService>();
        services.AddScoped<IOrdersService, OrdersService>();
        services.AddScoped<IAuditQueryService, AuditQueryService>();
        services.AddScoped<IInventoryAdminService, InventoryAdminService>();
        services.AddScoped<IShippingCalculator, DefaultShippingCalculator>();
        services.AddScoped<Regata.Application.Interface.IEmailSender, EmailSender>();
        services.AddHttpClient<Regata.Infrastructure.Integration.WebhookDispatcher>();
        services.AddScoped<Regata.API.Payments.StripeCheckoutService>();

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
        services.AddScoped<IOrderAdminService, OrderAdminService>();
        services.AddAuthorization();

        return services;
    }

    internal static string BuildNpgsqlConnectionString(IConfigurationSection dbSection)
    {
        var explicitCs = dbSection["ConnectionString"]
                        ?? Environment.GetEnvironmentVariable("DATABASE_CONNECTION");
        if (!string.IsNullOrWhiteSpace(explicitCs))
        {
            return explicitCs;
        }

        var host = dbSection["Host"]
                   ?? Environment.GetEnvironmentVariable("DATABASE_HOST")
                   ?? "localhost";
        var portValue = dbSection["Port"]
                        ?? Environment.GetEnvironmentVariable("DATABASE_PORT")
                        ?? "5432";
        var database = dbSection["Database"]
                       ?? Environment.GetEnvironmentVariable("DATABASE_NAME")
                       ?? "regata";
        var user = dbSection["Username"]
                   ?? Environment.GetEnvironmentVariable("DATABASE_USERNAME")
                   ?? "postgres";
        var password = dbSection["Password"]
                       ?? Environment.GetEnvironmentVariable("DATABASE_PASSWORD")
                       ?? "postgres";

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Database = database,
            Username = user,
            Password = password,
            Pooling = true
        };

        if (int.TryParse(portValue, out var port) && port > 0)
        {
            builder.Port = port;
        }

        var sslMode = dbSection["SslMode"]
                      ?? Environment.GetEnvironmentVariable("DATABASE_SSLMODE");
        if (!string.IsNullOrWhiteSpace(sslMode) && Enum.TryParse<SslMode>(sslMode, true, out var parsedSslMode))
        {
            builder.SslMode = parsedSslMode;
        }

        var trustServerCertificate = dbSection["TrustServerCertificate"]
                                   ?? Environment.GetEnvironmentVariable("DATABASE_TRUST_SERVER_CERTIFICATE");
        if (!string.IsNullOrWhiteSpace(trustServerCertificate) && bool.TryParse(trustServerCertificate, out var trustCert) && trustCert)
        {
            builder["Trust Server Certificate"] = true;
        }

        var applicationName = dbSection["ApplicationName"]
                              ?? Environment.GetEnvironmentVariable("DATABASE_APPLICATION_NAME");
        if (!string.IsNullOrWhiteSpace(applicationName))
        {
            builder.ApplicationName = applicationName;
        }

        var extraOptions = dbSection.GetSection("Options");
        foreach (var opt in extraOptions.GetChildren())
        {
            builder[opt.Key] = opt.Value;
        }

        return builder.ConnectionString;
    }
}
