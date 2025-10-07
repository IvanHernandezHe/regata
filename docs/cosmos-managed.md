# Azure Cosmos DB (NoSQL) en Azure

Este flujo usa una cuenta administrada de Azure Cosmos DB (API NoSQL) en lugar del emulador local.

## 1. Crear la cuenta

### Con Azure Portal
1. Abre el [Portal de Azure](https://portal.azure.com/).
2. **Crear recurso** → "Azure Cosmos DB".
3. Selecciona **API** = *Azure Cosmos DB for NoSQL*.
4. Elige suscripción, grupo de recursos, nombre de cuenta (`roue-nosql` por ejemplo) y región cercana.
5. Para entornos de prueba, selecciona *Capacidad por consumo (serverless)* o *Throughput aprovisionado* con un nivel bajo.
6. Revisa y crea la cuenta.

### Con Azure CLI
```bash
az cosmosdb create \
  --resource-group <grupo> \
  --name roue-nosql \
  --kind GlobalDocumentDB \
  --capabilities EnableServerless
```

## 2. Obtener endpoint y claves
```bash
az cosmosdb keys list \
  --name roue-nosql \
  --resource-group <grupo> \
  --type keys \
  --query "{endpoint:host, primaryKey:primaryMasterKey}" -o json
```
Registra `endpoint` y `primaryKey` (o usa "Connection String" desde el portal).

## 3. Conectar Azure Data Studio
1. Instala la extensión **Azure Cosmos DB (Preview)** si no la tienes.
2. En *New Connection* elige *Azure Cosmos DB (SQL API)*.
3. Usa:
   - **Account Endpoint**: tu `https://<account>.documents.azure.com:443/`
   - **Primary Key**: la clave principal.
   - **Account Name**: libre (ej. `roue-nosql`).
4. Conéctate para navegar colecciones y documentos.

## 4. Ejecutar el "seeder"
El proyecto `tools/Roue.CosmosSeeder` reutiliza las semillas existentes (marcas, llantas, rines, descuentos) y agrega imágenes.

```bash
COSMOS_ENDPOINT="https://<account>.documents.azure.com:443/" \
COSMOS_KEY="<primary-key>" \
COSMOS_DATABASE="roue-nosql" \
COSMOS_CONTAINER="catalog" \
dotnet run --project tools/Roue.CosmosSeeder/Roue.CosmosSeeder.csproj
```

Se crearán la base (`roue-nosql` por defecto), el contenedor `catalog` y los documentos.

## 5. Actualizar la aplicación

1. Define variables de entorno en tu host o archivo `.env`:
   ```bash
   export COSMOS_ENDPOINT="https://<account>.documents.azure.com:443/"
   export COSMOS_KEY="<primary-key>"
   export COSMOS_DATABASE="roue-nosql"
   export COSMOS_CONTAINER="catalog"
   ```
2. Ajusta los servicios que consumen Cosmos (por ejemplo, el seeder o futuras integraciones en la API) para leer estos valores.
   - El seeder ya usa dichas variables.
   - Si migras partes de la API, reutiliza los mismos nombres para simplificar despliegues.

## 6. Buenas prácticas
- Crea un **segundo contenedor** o base para staging en la misma cuenta y asigna throughput independiente si lo requieres.
- Usa **roles RBAC/Credenciales administradas** en producción en lugar de claves maestras.
- Para tests automatizados, puedes crear una base prefijada (`roue-e2e-<build>`) y destruirla al finalizar.

Con esto eliminas la dependencia del emulador y puedes visualizar/consultar los datos desde Azure Data Studio u otras herramientas compatibles.
