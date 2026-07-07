# azure_infra\infra_core_terraform\postgres.tf


# ------------------------------------------------------------------
# File: azure_infra/infra_core_terraform/postgres.tf
# ------------------------------------------------------------------
# Azure PostgreSQL Flexible Server
# ------------------------------------------------------------------

resource "azurerm_postgresql_flexible_server" "db" {
  name                = "pdfconvert-db"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  administrator_login    = var.db_user
  administrator_password = var.db_password

  sku_name   = "B_Standard_B1ms"
  version    = "15"
  storage_mb = 32768

  backup_retention_days = 7

  # ------------------------------------------------------------------
  # PUBLIC ACCESS
  # ------------------------------------------------------------------
  # KEEP TRUE FOR NOW until Private Endpoint + DNS are verified
  # After validation, this should be set to false
  public_network_access_enabled = false

  # ------------------------------------------------------------------
  # Azure frequently changes/assigns zones automatically.
  # Ignore those changes to prevent Terraform failures.
  # ------------------------------------------------------------------
  lifecycle {
    ignore_changes = [
      zone,
      high_availability
    ]
  }
}

# ------------------------------------------------------------------
# Firewall rule: allow Azure services (App Service, Functions, etc.)
# REQUIRED for current connectivity (temporary compatibility layer)
# ------------------------------------------------------------------
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.db.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# ------------------------------------------------------------------
# PostgreSQL Flexible Server Database
# ------------------------------------------------------------------
# Creates a logical database inside the Azure PostgreSQL server.
# This is NOT the server itself — it is the container where tables,
# schemas, and application data live.
#
# Example structure:
#   Server:  pdfconvert-db
#   Database: converter
#   Tables:   conversions, users, etc.
# ------------------------------------------------------------------
resource "azurerm_postgresql_flexible_server_database" "db" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.db.id

  # Character set used for text encoding in the database
  charset   = "UTF8"

  # Collation defines sorting rules for text comparison
  collation = "en_US.utf8"
}

# ------------------------------------------------------------------
# PRIVATE ENDPOINT (ADDED)
# ------------------------------------------------------------------
# Connects PostgreSQL to the private VNet so traffic never leaves Azure backbone
# ------------------------------------------------------------------
resource "azurerm_private_endpoint" "postgres" {
  name                = "pe-postgres-${var.project_name}"
  location            = azurerm_resource_group.spoke_network.location
  resource_group_name = azurerm_resource_group.spoke_network.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "postgres-psc"
    private_connection_resource_id = azurerm_postgresql_flexible_server.db.id
    subresource_names              = ["postgresqlServer"]
    is_manual_connection           = false
  }

  # ------------------------------------------------------------------
  # FIX: Correct AzureRM way to attach Private DNS Zone to Private Endpoint
  # NOTE: There is NO standalone azurerm_private_dns_zone_group resource
  # ------------------------------------------------------------------
  private_dns_zone_group {
    name = "postgres-dns-group"

    private_dns_zone_ids = [
      azurerm_private_dns_zone.postgres.id
    ]
  }
}