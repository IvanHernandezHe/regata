using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Roue.API.Extensions;
using Roue.API.Middleware;
using Roue.Infrastructure.Persistence;
using Npgsql;
using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) =>
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .WriteTo.Console());

    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
    builder.Services.AddControllers();

    var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
                      ?? new[] { "http://localhost:4200" };
    builder.Services.AddCors(o =>
    {
        o.AddDefaultPolicy(p => p
            .AllowAnyHeader()
            .AllowAnyMethod()
            .WithOrigins(corsOrigins)
            .AllowCredentials());
    });

    var dbConnectionString = ServiceCollectionExtensions.BuildNpgsqlConnectionString(builder.Configuration.GetSection("Database"));
    builder.Services.AddHealthChecks()
        .AddNpgSql(dbConnectionString, name: "postgres", tags: new[] { "ready" });

    var app = builder.Build();

    // Order: exceptions -> correlation -> identity audit -> CORS -> rest
    app.UseMiddleware<ExceptionLoggingMiddleware>();
    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseMiddleware<IdentityAuditMiddleware>();
    app.UseCors();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    if (System.IO.Directory.Exists(app.Environment.WebRootPath))
    {
        app.UseDefaultFiles();
        app.UseStaticFiles();
    }

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapGroup("/api/auth").MapIdentityApi<Microsoft.AspNetCore.Identity.IdentityUser<Guid>>();

    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = _ => false
    });

    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = r => r.Tags.Contains("ready"),
        ResponseWriter = async (context, report) =>
        {
            context.Response.ContentType = "application/json";
            var payload = new
            {
                status = report.Status.ToString(),
                entries = report.Entries.Select(e => new
                {
                    name = e.Key,
                    status = e.Value.Status.ToString(),
                    duration = e.Value.Duration.TotalMilliseconds
                })
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
    });

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cfg = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            var resetFlag = cfg["Database:ResetOnStart"];
            var envReset = Environment.GetEnvironmentVariable("RESET_DB");
            var shouldReset = IsTrue(resetFlag) || IsTrue(envReset);
            if (shouldReset)
            {
                await db.Database.EnsureDeletedAsync();
            }

            await db.Database.MigrateAsync();

            var seedFlag = cfg["Database:SeedOnStart"];
            var envSeed = Environment.GetEnvironmentVariable("SEED_DB");
            var shouldSeed = shouldReset || IsTrue(seedFlag) || IsTrue(envSeed);

            if (!shouldSeed)
            {
                shouldSeed = !await db.Products.AsNoTracking().AnyAsync();
            }

            if (shouldSeed)
            {
                await Roue.Infrastructure.Seed.DataSeeder.SeedAsync(scope.ServiceProvider);
            }
            else
            {
                logger.LogInformation("Skipping data seeding because Database:SeedOnStart is false and data already exists.");
            }
        }
        catch (Exception ex)
        {
            var provider = cfg["Database:Provider"] ?? "CosmosPostgres";
            var connectionDescriptor = DescribeConnection(cfg);
            logger.LogError(ex,
                "Failed to initialise database. Provider={Provider}; Connection={Connection}. Ensure the database container is running and accessible, or override the settings.",
                provider,
                connectionDescriptor);
            throw;
        }
    }

    if (System.IO.Directory.Exists(app.Environment.WebRootPath))
    {
        app.MapFallbackToFile("index.html");
    }

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

static bool IsTrue(string? value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return false;
    }

    return value.Equals("true", StringComparison.OrdinalIgnoreCase)
           || value.Equals("1", StringComparison.OrdinalIgnoreCase)
           || value.Equals("yes", StringComparison.OrdinalIgnoreCase)
           || value.Equals("on", StringComparison.OrdinalIgnoreCase);
}

static string DescribeConnection(IConfiguration cfg)
{
    var explicitCs = cfg["Database:ConnectionString"] ?? Environment.GetEnvironmentVariable("DATABASE_CONNECTION");
    if (!string.IsNullOrWhiteSpace(explicitCs))
    {
        try
        {
            var builder = new NpgsqlConnectionStringBuilder(explicitCs);
            if (!string.IsNullOrEmpty(builder.Password))
            {
                builder.Password = "********";
            }
            return builder.ToString();
        }
        catch
        {
            return "Custom connection string";
        }
    }

    var host = cfg["Database:Host"] ?? Environment.GetEnvironmentVariable("DATABASE_HOST") ?? "localhost";
    var port = cfg["Database:Port"] ?? Environment.GetEnvironmentVariable("DATABASE_PORT") ?? "5432";
    var dbName = cfg["Database:Database"] ?? Environment.GetEnvironmentVariable("DATABASE_NAME") ?? "roue";
    var ssl = cfg["Database:SslMode"] ?? Environment.GetEnvironmentVariable("DATABASE_SSLMODE") ?? "Disable";
    return $"Host={host};Port={port};Database={dbName};SslMode={ssl}";
}
