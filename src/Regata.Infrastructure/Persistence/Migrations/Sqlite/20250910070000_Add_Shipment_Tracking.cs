using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Regata.Infrastructure.Persistence.Migrations.Sqlite
{
    public partial class Add_Shipment_Tracking : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ShipTrackingCarrier",
                table: "Orders",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShipTrackingCode",
                table: "Orders",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ShippedAtUtc",
                table: "Orders",
                type: "TEXT",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShipTrackingCarrier",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ShipTrackingCode",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ShippedAtUtc",
                table: "Orders");
        }
    }
}

