# Azure Cosmos DB Emulator Setup

## Start the emulator container

```bash
docker compose -f docker-compose.cosmos.yml up -d
```

This publishes the HTTPS endpoint on `https://localhost:8081/` and the data plane ports `10250-10255`. Data is persisted in the `cosmos-emulator-data` Docker volume.

## Export the TLS certificate (Linux/macOS)

```bash
docker exec roue-cosmos-emulator cat /usr/local/share/ca-certificates/emulatorcert.crt \
  | sudo tee /usr/local/share/ca-certificates/cosmos-emulator.crt >/dev/null
sudo update-ca-certificates
```

On Windows, run:

```powershell
docker exec roue-cosmos-emulator powershell -Command \
  "Get-Content C:\\CosmosEmulator\\emulatorcert.cer" \
  | Out-File -FilePath cosmos-emulator.cer -Encoding byte
Import-Certificate -FilePath .\\cosmos-emulator.cer -CertStoreLocation Cert:\\CurrentUser\\Root
```

Restart Azure Data Studio or your browser after trusting the certificate.

## Connect with Azure Data Studio

1. Install the **Azure Cosmos DB (Preview)** extension.
2. Open *Connections* → *Add Connection*.
3. Choose **Azure Cosmos DB (SQL API)**.
4. Use these defaults:
   - Account Endpoint: `https://localhost:8081/`
   - Primary Key: `C2y6yDjf5/R+ob0N8A7Cgv30VRjYHYfC6az4g==`
   - Account Name: `roue-local`
5. Connect to browse databases, containers, and documents.

The same credentials are used by the seeder tool and application defaults.

## Seed sample data

Run the console seeder after the emulator is online:

```bash
dotnet run --project tools/Roue.CosmosSeeder/Roue.CosmosSeeder.csproj
```

Override the endpoint/key with environment variables if you are targeting a managed Azure Cosmos DB account:

```bash
COSMOS_ENDPOINT="https://<account>.documents.azure.com:443/" \
COSMOS_KEY="<primary-key>" \
COSMOS_DATABASE="roue-nosql" \
dotnet run --project tools/Roue.CosmosSeeder/Roue.CosmosSeeder.csproj
```
