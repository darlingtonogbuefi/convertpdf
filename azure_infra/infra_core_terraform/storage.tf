#  azure_infra\infra_core_terraform\storage.tf

# ------------------------------------------------------------------
# Storage Account
# Static website hosting for frontend SPA
# ------------------------------------------------------------------

resource "azurerm_storage_account" "static" {
  name                     = "pdfconvertstatic123"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location

  account_tier             = "Standard"
  account_replication_type = "LRS"

  # ------------------------------------------------
  # Static website hosting
  # ------------------------------------------------
  static_website {
    index_document     = "index.html"
    error_404_document = "index.html"
  }

  # ------------------------------------------------
  # Security
  # ------------------------------------------------
  min_tls_version = "TLS1_2"

  allow_nested_items_to_be_public = false

  # Keep public for now.
  # Will be revisited after Private Endpoints are configured.
  public_network_access_enabled = true
}

# ------------------------------------------------------------------
# Storage Account
# Private application data (uploads, converted files, profile images)
# ------------------------------------------------------------------

resource "azurerm_storage_account" "private" {
  name                     = "pdfconvertprivate123"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location

  account_tier             = "Standard"
  account_replication_type = "LRS"

  # ------------------------------------------------
  # Security
  # ------------------------------------------------
  min_tls_version = "TLS1_2"

  allow_nested_items_to_be_public = false

  # Keep public for now.
  # This will be disabled after Private Endpoint is fully validated.
  public_network_access_enabled = false
}

# ------------------------------------------------------------------
# Private files container
# Used for uploaded PDFs
# ------------------------------------------------------------------

resource "azurerm_storage_container" "frontend_private" {
  name                  = "frontend-private"
  storage_account_name  = azurerm_storage_account.private.name
  container_access_type = "private"
}

# ------------------------------------------------------------------
# Original uploaded files
# ------------------------------------------------------------------

resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.private.name
  container_access_type = "private"
}

# ------------------------------------------------------------------
# Converted output files
# ------------------------------------------------------------------

resource "azurerm_storage_container" "converted" {
  name                  = "converted"
  storage_account_name  = azurerm_storage_account.private.name
  container_access_type = "private"
}

# ------------------------------------------------------------------
# User profile pictures
# ------------------------------------------------------------------

resource "azurerm_storage_container" "profile_pictures" {
  name                  = "profile-pictures"
  storage_account_name  = azurerm_storage_account.private.name
  container_access_type = "private"
}

# ==========================================================
# PRIVATE ENDPOINT FOR BLOB STORAGE
# ==========================================================

resource "azurerm_private_endpoint" "storage_blob" {
  name                = "pe-blob-${var.project_name}"
  location            = azurerm_resource_group.spoke_network.location
  resource_group_name = azurerm_resource_group.spoke_network.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "blob-psc"
    private_connection_resource_id = azurerm_storage_account.private.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  # IMPORTANT:
  # DNS zone group is ONLY defined here (not duplicated in dns.tf)
  private_dns_zone_group {
    name = "blob-dns-group"

    private_dns_zone_ids = [
      azurerm_private_dns_zone.blob.id
    ]
  }
}