using Regata.API.Extensions;
using Regata.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Regata.API.Middleware;
using Microsoft.Extensions.Configuration;

var builder = WebApplication.CreateBuilder(args);
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

// Serve SPA static files only if wwwroot exists (avoid warnings in dev)
if (System.IO.Directory.Exists(app.Environment.WebRootPath))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGroup("/api/auth").MapIdentityApi<Microsoft.AspNetCore.Identity.IdentityUser<Guid>>();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var cfg = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var resetFlag = cfg["Database:ResetOnStart"];
    var envReset = Environment.GetEnvironmentVariable("RESET_DB");
    if (string.Equals(resetFlag, "true", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(envReset, "true", StringComparison.OrdinalIgnoreCase))
    {
        // Development convenience: drop and recreate database from migrations
        await db.Database.EnsureDeletedAsync();
    }
    await db.Database.MigrateAsync();
    await Regata.Infrastructure.Seed.DataSeeder.SeedAsync(scope.ServiceProvider);
}

// Client-side routing fallback to index.html (if file exists)
if (System.IO.Directory.Exists(app.Environment.WebRootPath))
{
    app.MapFallbackToFile("index.html");
}

app.Run();
