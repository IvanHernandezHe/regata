# syntax=docker/dockerfile:1

# Reuse a single SDK image for restore, build, and tests
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS sdk
WORKDIR /src

# Copy solution and project files first to leverage Docker layer caching
COPY Regata.sln ./
COPY src/Regata.API/Regata.API.csproj src/Regata.API/
COPY src/Regata.Application/Regata.Application.csproj src/Regata.Application/
COPY src/Regata.Domain/Regata.Domain.csproj src/Regata.Domain/
COPY src/Regata.Infrastructure/Regata.Infrastructure.csproj src/Regata.Infrastructure/
COPY tests/Regata.Tests.Unit/Regata.Tests.Unit.csproj tests/Regata.Tests.Unit/
COPY tools/Regata.CosmosSeeder/Regata.CosmosSeeder.csproj tools/Regata.CosmosSeeder/
RUN dotnet restore Regata.sln

# Bring in the rest of the source tree
COPY . .

# Build stage keeps build artifacts ready for publish or tests
FROM sdk AS build
RUN dotnet build Regata.sln -c Release --no-restore

# Publish a trimmed runtime payload for the API container
FROM build AS publish
RUN dotnet publish src/Regata.API/Regata.API.csproj -c Release -o /app/publish --no-build

# Dedicated test runner stage to execute solution tests inside Docker
FROM build AS test-runner
WORKDIR /src
CMD ["dotnet", "test", "Regata.sln", "-c", "Release", "--no-build", "--logger:trx"]

# Final runtime image for serving the ASP.NET Core API
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=publish /app/publish ./
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Regata.API.dll"]
