using Microsoft.Azure.Cosmos;

var endpoint = Environment.GetEnvironmentVariable("COSMOS_ENDPOINT") ?? "https://localhost:8081/";
var key = Environment.GetEnvironmentVariable("COSMOS_KEY") ?? "C2y6yDjf5/R+ob0N8A7Cgv30VRjYHYfC6az4g==";
var databaseId = Environment.GetEnvironmentVariable("COSMOS_DATABASE") ?? "roue-nosql";
var containerId = Environment.GetEnvironmentVariable("COSMOS_CONTAINER") ?? "catalog";

Console.WriteLine($"Seeding Azure Cosmos DB endpoint {endpoint} (database '{databaseId}', container '{containerId}')...");

var clientOptions = new CosmosClientOptions
{
    SerializerOptions = new CosmosSerializationOptions
    {
        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
    }
};

using var client = new CosmosClient(endpoint, key, clientOptions);

var databaseResponse = await client.CreateDatabaseIfNotExistsAsync(databaseId, throughput: 400);
var containerResponse = await databaseResponse.Database.CreateContainerIfNotExistsAsync(new ContainerProperties
{
    Id = containerId,
    PartitionKeyPath = "/pk"
});

var container = containerResponse.Container;
var now = DateTime.UtcNow;

var brandMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
var brandDocs = SeedData.GetBrandDocuments(now);
var brandWrites = 0;
foreach (var brand in brandDocs)
{
    await container.UpsertItemAsync(brand, new PartitionKey(brand.pk));
    brandMap[brand.name] = brand.id;
    brandWrites++;
}

var productWrites = 0;
foreach (var product in SeedData.GetProductDocuments(now, brandMap))
{
    await container.UpsertItemAsync(product, new PartitionKey(product.pk));
    productWrites++;
}

var discountWrites = 0;
foreach (var discount in SeedData.GetDiscountDocuments(now))
{
    await container.UpsertItemAsync(discount, new PartitionKey(discount.pk));
    discountWrites++;
}

Console.WriteLine($"Seed complete: {brandWrites} brands, {productWrites} products, {discountWrites} discounts.");

internal static class SeedData
{
    internal static IEnumerable<BrandDocument> GetBrandDocuments(DateTime timestamp)
    {
        foreach (var seed in BrandSeeds)
        {
            yield return new BrandDocument
            {
                id = seed.Id.ToString().ToLowerInvariant(),
                pk = "brand",
                type = "brand",
                name = seed.Name,
                logoUrl = seed.LogoUrl,
                active = seed.Active,
                createdAtUtc = timestamp,
                updatedAtUtc = timestamp
            };
        }
    }

    internal static IEnumerable<ProductDocument> GetProductDocuments(DateTime timestamp, IReadOnlyDictionary<string, string> brandMap)
    {
        foreach (var tire in TireSeeds)
        {
            var brandId = ResolveBrandId(brandMap, tire.Brand);
            yield return new ProductDocument
            {
                id = tire.Sku,
                pk = $"brand#{tire.Brand.ToLowerInvariant()}",
                type = "product",
                sku = tire.Sku,
                brand = new ProductBrand
                {
                    id = brandId,
                    name = tire.Brand
                },
                modelName = tire.Model,
                size = tire.Size,
                category = "llantas",
                price = tire.Price,
                images = new[] { "/assets/pzero-1_80.jpg", "/assets/pzero-1_80.jpg", "/assets/pzero-1_80.jpg" },
                specs = new ProductSpecs
                {
                    kind = "tire",
                    details = new Dictionary<string, object>
                    {
                        ["application"] = tire.Size.Contains("R") && tire.Size.Contains("70") ? "CAMIONETA" : "AUTO",
                        ["loadIndex"] = "107(975Kg.)",
                        ["speedRating"] = "H (210Km/hr)"
                    }
                },
                inventory = new InventoryDocument { quantity = tire.Stock },
                createdAtUtc = timestamp,
                updatedAtUtc = timestamp
            };
        }

        foreach (var rim in RimSeeds)
        {
            var brandId = ResolveBrandId(brandMap, rim.Brand);
            yield return new ProductDocument
            {
                id = rim.Sku,
                pk = $"brand#{rim.Brand.ToLowerInvariant()}",
                type = "product",
                sku = rim.Sku,
                brand = new ProductBrand
                {
                    id = brandId,
                    name = rim.Brand
                },
                modelName = rim.Model,
                size = rim.Size,
                category = "rines",
                price = rim.Price,
                images = new[] { "/assets/pzero-1_80.jpg" },
                specs = new ProductSpecs
                {
                    kind = "rim",
                    details = new Dictionary<string, object>
                    {
                        ["diameter"] = rim.Diameter,
                        ["width"] = rim.Width,
                        ["boltPattern"] = rim.Pattern,
                        ["offset"] = rim.Offset,
                        ["centerBore"] = rim.CenterBore,
                        ["material"] = rim.Material,
                        ["finish"] = rim.Finish
                    }
                },
                inventory = new InventoryDocument { quantity = rim.Stock },
                createdAtUtc = timestamp,
                updatedAtUtc = timestamp
            };
        }
    }

    internal static IEnumerable<DiscountDocument> GetDiscountDocuments(DateTime timestamp)
    {
        yield return new DiscountDocument
        {
            id = "ROUE10",
            pk = "discount",
            type = "discount",
            code = "ROUE10",
            discountType = "percentage",
            value = 10m,
            active = true,
            expiresAtUtc = timestamp.AddMonths(6),
            maxRedemptions = 1000
        };

        yield return new DiscountDocument
        {
            id = "ROUE200",
            pk = "discount",
            type = "discount",
            code = "ROUE200",
            discountType = "fixed",
            value = 200m,
            active = true,
            expiresAtUtc = timestamp.AddMonths(6),
            maxRedemptions = 1000
        };
    }

    private static string ResolveBrandId(IReadOnlyDictionary<string, string> brandMap, string brandName)
    {
        if (brandMap.TryGetValue(brandName, out var value))
        {
            return value;
        }

        throw new KeyNotFoundException($"Brand '{brandName}' is missing. Ensure brand seeds run before product seeds.");
    }

    private static readonly IReadOnlyList<BrandSeed> BrandSeeds = new List<BrandSeed>
    {
        new("97A097A2-C054-4C68-AF38-8960FB3739AC", "Roue", "/assets/brand/roue-mark2.svg", true),
        new("0BA11187-712D-40FE-AFBB-2B70F49939A0", "Enkei", null, true),
        new("9D8C7B6A-4F1E-42C9-A1D2-3B4E5F6C7D8E", "CONTINENTAL", "/assets/brand/continental.png", true),
        new("F2A4D9B1-5E8C-4A31-B96D-7F8E1C0D3A5B", "COOPER", "/assets/brand/cooper.png", true),
        new("2A1B3C4D-5E6F-4071-8A9B-C1D2E3F4A5B6", "DELMAX", "/assets/brand/delmax.png", true),
        new("8B0D2A7C-3F4E-4E78-8D2B-6C1F5E9A2D3E", "GOODYEAR", "/assets/brand/goodyear.png", false),
        new("B7C6D5E4-F3A2-4109-8765-43210FEDCBA9", "HAIDA", "/assets/brand/haida.png", true),
        new("C963E6E8-2C2B-42E6-A843-03E54B6099B2", "HANKOOK", "/assets/brand/hankook.png", false),
        new("6E1C0D2A-3B4E-4F5C-8D9E-A1B2C3D4E5F6", "NEXEN", "/assets/brand/nexen.png", false),
        new("1A5F6E3A-7A13-4C9D-8F83-E02D6B359F1C", "PIRELLI", "/assets/brand/pirelli.png", true),
        new("0A1B2C3D-4E5F-4678-90AB-CDEF01234567", "POWERHUB", "/assets/brand/powerhub.jpg", true),
        new("1F2E3D4C-5B6A-4789-C0D1-E2F3A4B5C6D7", "ROADMASTER", "/assets/brand/roadmaster.png", false),
        new("A7D1C0B3-E5F6-4D2C-9B8A-1F2E3D4C5B6A", "ROYALBLACK", "/assets/brand/royalblack.png", true),
        new("E9F8D7C6-5B4A-4321-9E0F-1A2B3C4D5E6F", "TORNEL", "/assets/brand/tornel.png", false),
        new("D8C7B6A5-E4F3-4210-9876-543210FEDCBA", "TORQUE", "/assets/brand/torque.png", true),
        new("4C3B2A1D-5E6F-4071-8A9B-A0B1C2D3E4F5", "TOWNHALL", "/assets/brand/townhall.png", true),
        new("4E9B2C84-6735-4B10-9F7A-B1C2D3E4F5A6", "BFGOODRICH", null, true)
    };

    private static readonly IReadOnlyList<TireSeed> TireSeeds = new List<TireSeed>
    {
        new("REG-2055516-1", "Roue", "Suntire Street", "205/55R16", 1899m, 20),
        new("REG-2156516-1", "Roue", "Suntire Touring", "215/65R16", 2599m, 15),
        new("REG-1956515-1", "Roue", "Suntire Eco", "195/65R15", 1599m, 25),
        new("REG-2254018-1", "Roue", "Suntire Sport", "225/40R18", 3299m, 10),
        new("REG-2254517-1", "Roue", "Suntire Pro", "225/45R17", 2899m, 18),
        new("REG-2355018-1", "Roue", "Suntire Pro+", "235/50R18", 3499m, 8),
        new("REG-2657016-1", "Roue", "Suntire AT", "265/70R16", 4099m, 12),
        new("REG-2755519-1", "Roue", "Suntire UHP", "275/55R19", 4699m, 6)
    };

    private static readonly IReadOnlyList<RimSeed> RimSeeds = new List<RimSeed>
    {
        new("RIM-ENK-18X8-5X114.3-45", "Enkei", "TS-5", "18x8 5x114.3 ET45", 3599m, 12, 18, 8, "5x114.3", 45, 66.1, "Aluminio", "Negro satinado"),
        new("RIM-REG-17X7.5-5X112-35", "Roue", "StreetFlow", "17x7.5 5x112 ET35", 2799m, 20, 17, 7.5, "5x112", 35, 66.6, "Aluminio", "Gris")
    };

    private sealed record BrandSeed(string Id, string Name, string? LogoUrl, bool Active);

    private sealed record TireSeed(string Sku, string Brand, string Model, string Size, decimal Price, int Stock);

    private sealed record RimSeed(string Sku, string Brand, string Model, string Size, decimal Price, int Stock,
                                  double Diameter, double Width, string Pattern, int Offset, double CenterBore,
                                  string Material, string Finish);
}

internal sealed record BrandDocument
{
    public required string id { get; init; }
    public required string pk { get; init; }
    public required string type { get; init; }
    public required string name { get; init; }
    public string? logoUrl { get; init; }
    public bool active { get; init; }
    public required DateTime createdAtUtc { get; init; }
    public required DateTime updatedAtUtc { get; init; }
}

internal sealed record ProductDocument
{
    public required string id { get; init; }
    public required string pk { get; init; }
    public required string type { get; init; }
    public required string sku { get; init; }
    public required ProductBrand brand { get; init; }
    public required string modelName { get; init; }
    public required string size { get; init; }
    public required string category { get; init; }
    public required decimal price { get; init; }
    public required string[] images { get; init; }
    public required ProductSpecs specs { get; init; }
    public required InventoryDocument inventory { get; init; }
    public required DateTime createdAtUtc { get; init; }
    public required DateTime updatedAtUtc { get; init; }
}

internal sealed record ProductBrand
{
    public required string id { get; init; }
    public required string name { get; init; }
}

internal sealed record ProductSpecs
{
    public required string kind { get; init; }
    public required Dictionary<string, object> details { get; init; }
}

internal sealed record InventoryDocument
{
    public required int quantity { get; init; }
}

internal sealed record DiscountDocument
{
    public required string id { get; init; }
    public required string pk { get; init; }
    public required string type { get; init; }
    public required string code { get; init; }
    public required string discountType { get; init; }
    public required decimal value { get; init; }
    public required bool active { get; init; }
    public required DateTime expiresAtUtc { get; init; }
    public required int maxRedemptions { get; init; }
}
