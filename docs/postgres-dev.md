# Postgres local para desarrollo rápido

## 1. Levantar el contenedor

```bash
docker run \
  --name roue-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=roue \
  -p 5432:5432 \
  -d postgres:15-alpine
```

La imagen oficial es multi-arquitectura, así que funciona en Apple Silicon.

Para detener/iniciar posteriormente:

```bash
docker stop roue-postgres
docker start roue-postgres
```

## 2. Configuración de la API

`appsettings.json` ya apunta a `Host=localhost; Port=5432; Database=roue; Username=postgres; Password=postgres`.

En desarrollo (`appsettings.Development.json`) se forzó el mismo host, así que no necesitas valores adicionales. Solo asegúrate de que el puerto 5432 esté libre.

Opcional: exporta variables de entorno si deseas sobreescribir parámetros puntuales:

```bash
export DATABASE_PASSWORD=postgres
export DATABASE_RESETONSTART=true
```

## 3. Inicializar datos

Al ejecutar la API, `Database.MigrateAsync()` aplica las migraciones de EF Core y luego `DataSeeder` reproduce las semillas (marcas, productos, inventario, descuentos, usuarios demo). No necesitas comandos extras.

Si prefieres hacerlo manualmente:

```bash
dotnet ef database update \
  --project src/Roue.Infrastructure/Roue.Infrastructure.csproj \
  --startup-project src/Roue.API/Roue.API.csproj
```

```bash
dotnet run --project src/Roue.API/Roue.API.csproj
```

## 4. Probar conexión

- **psql** (opcional):

  ```bash
  docker exec -it roue-postgres psql -U postgres -d roue -c "SELECT COUNT(*) FROM \"Products\";"
  ```

- **Azure Data Studio / DBeaver**: crea conexión PostgreSQL con host `localhost`, puerto `5432`, usuario `postgres`, contraseña `postgres`, base `roue`.

Con esto podrás seguir desarrollando sin esperar a la cuenta Cosmos. Más adelante puedes volver a la opción NoSQL usando el seeder dedicado.
