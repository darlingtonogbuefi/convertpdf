# ------------------------------------------------------------------
# File: azure_infra/infra_core_terraform/keyvault.tf
# ------------------------------------------------------------------
# Azure Key Vault
# Stores secrets securely (infra only - no secret values)
# ------------------------------------------------------------------

# ------------------------------------------------------------------
# Azure Key Vault
# ------------------------------------------------------------------

resource "azurerm_key_vault" "kv" {
  name                = "${var.project_name}kv"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id

  sku_name = "standard"

  # REQUIRED BY AZURE POLICY
  soft_delete_retention_days  = 90
  purge_protection_enabled    = true

  enable_rbac_authorization    = true
  public_network_access_enabled = false
}

# ------------------------------------------------------------------
# Key Vault Private Endpoint
# ------------------------------------------------------------------

resource "azurerm_private_endpoint" "keyvault" {
  name                = "${var.project_name}-kv-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "keyvault-connection"
    private_connection_resource_id = azurerm_key_vault.kv.id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name = "keyvault-dns-group"

    private_dns_zone_ids = [
      azurerm_private_dns_zone.keyvault.id
    ]
  }
}

# ------------------------------------------------------------------
# RBAC permissions for current user/service principal
# ------------------------------------------------------------------

resource "azurerm_role_assignment" "kv_admin" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_key_vault_secret" "database_url" {
  name = "database-url"

  value = "postgresql+psycopg2://${var.db_user}:${var.db_password}@${azurerm_postgresql_flexible_server.db.fqdn}:5432/converter?sslmode=require"

  key_vault_id = azurerm_key_vault.kv.id

  expiration_date = "2026-09-07T00:00:00Z"
  content_type    = "connection-string"
}

# ------------------------------------------------------------------
# GitHub Actions OIDC → Key Vault access
# ------------------------------------------------------------------

resource "azurerm_role_assignment" "github_kv" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azuread_service_principal.github.object_id
}