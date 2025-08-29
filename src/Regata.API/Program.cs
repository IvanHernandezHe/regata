using Regata.API.Extensions;
using Regata.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddCors(o =>
{
    o.AddDefaultPolicy(p => p
        .AllowAnyHeader()
        .AllowAnyMethod()
        .WithOrigins("http://localhost:4200"));
});

var app = builder.Build();
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

app.MapControllers();
app.MapGroup("/api/auth").MapIdentityApi<Microsoft.AspNetCore.Identity.IdentityUser<Guid>>();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await Regata.Infrastructure.Seed.DataSeeder.SeedAsync(db);
}

// Client-side routing fallback to index.html (if file exists)
if (System.IO.Directory.Exists(app.Environment.WebRootPath))
{
    app.MapFallbackToFile("index.html");
}

app.Run();
