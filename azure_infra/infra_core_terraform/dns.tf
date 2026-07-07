# azure_infra\infra_core_terraform\dns.tf


# ============================================================
# DNS ZONES
# ============================================================

data "azurerm_dns_zone" "pdfconverterpro" {
  name                = "pdfconverterpro.cribr.co.uk"
  resource_group_name = "dns-rg"
}

data "azurerm_dns_zone" "convertpdf" {
  name                = "convertpdf.cribr.co.uk"
  resource_group_name = "dns-rg"
}

# ============================================================
# IMPORTANT CHANGE:
# CIAM ZONE IS NO LONGER MANAGED IN AZURE DNS
# (Vercel owns cribr.co.uk DNS)
# ============================================================

# Removed:
# data "azurerm_dns_zone" "ciam"

# ============================================================
# PDFCONVERTERPRO DOMAIN
# ============================================================

resource "azurerm_dns_cname_record" "pdfconverterpro_www" {
  name                = "www"
  zone_name           = data.azurerm_dns_zone.pdfconverterpro.name
  resource_group_name = data.azurerm_dns_zone.pdfconverterpro.resource_group_name
  ttl                 = 300

  record = azurerm_cdn_frontdoor_endpoint.frontend.host_name
}

resource "azurerm_dns_cname_record" "pdfconverterpro_api" {
  name                = "api"
  zone_name           = data.azurerm_dns_zone.pdfconverterpro.name
  resource_group_name = data.azurerm_dns_zone.pdfconverterpro.resource_group_name
  ttl                 = 300

  record = replace(
    replace(azurerm_api_management.apim.gateway_url, "https://", ""),
    "/",
    ""
  )
}

# ============================================================
# CONVERTPDF DOMAIN
# ============================================================

resource "azurerm_dns_cname_record" "convertpdf_www" {
  name                = "www"
  zone_name           = data.azurerm_dns_zone.convertpdf.name
  resource_group_name = data.azurerm_dns_zone.convertpdf.resource_group_name
  ttl                 = 300

  record = azurerm_cdn_frontdoor_endpoint.frontend.host_name
}

resource "azurerm_dns_cname_record" "convertpdf_api" {
  name                = "api"
  zone_name           = data.azurerm_dns_zone.convertpdf.name
  resource_group_name = data.azurerm_dns_zone.convertpdf.resource_group_name
  ttl                 = 300

  record = replace(
    replace(azurerm_api_management.apim.gateway_url, "https://", ""),
    "/",
    ""
  )
}

# ============================================================
# CIAM CUSTOM DOMAIN DNS RECORD (VERCEL MANAGED)
# ============================================================

# ❌ REMOVED from Azure DNS (this was causing your conflict)

# ============================================================
# WHAT YOU MUST CREATE IN VERCEL INSTEAD
# ============================================================

# Type: CNAME
# Name: login
# Value: <your-frontdoor-endpoint>.azurefd.net

# ============================================================
# REQUIRED FRONT DOOR VALIDATION (NOT IN THIS FILE)
# ============================================================

# _dnsauth.login TXT record required in Vercel DNS

# ============================================================
# POSTGRESQL PRIVATE DNS
# ============================================================

resource "azurerm_private_dns_zone" "postgres" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = "dns-rg"
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "postgres-dns-link"
  resource_group_name   = "dns-rg"
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.spoke.id
}

# ============================================================
# BLOB STORAGE PRIVATE DNS
# ============================================================

resource "azurerm_private_dns_zone" "blob" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = "dns-rg"
}

resource "azurerm_private_dns_zone_virtual_network_link" "blob" {
  name                  = "blob-dns-link"
  resource_group_name   = "dns-rg"
  private_dns_zone_name = azurerm_private_dns_zone.blob.name
  virtual_network_id    = azurerm_virtual_network.spoke.id
}

# ============================================================
# KEY VAULT PRIVATE DNS
# ============================================================

resource "azurerm_private_dns_zone" "keyvault" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = "dns-rg"
}

resource "azurerm_private_dns_zone_virtual_network_link" "keyvault" {
  name                  = "keyvault-dns-link"
  resource_group_name   = "dns-rg"
  private_dns_zone_name = azurerm_private_dns_zone.keyvault.name
  virtual_network_id    = azurerm_virtual_network.spoke.id
}

# ============================================================
# POSTGRES DNS ZONE GROUP NOTE
# ============================================================

# FIX: NO STANDALONE DNS ZONE GROUP RESOURCE EXISTS IN AZURERM
# ❌ REMOVED:
# resource "azurerm_private_dns_zone_group" "postgres"
#
# ✅ REPLACEMENT IS A NESTED BLOCK INSIDE PRIVATE ENDPOINT
#
# IMPORTANT:
# Add the following INSIDE your existing azurerm_private_endpoint "postgres":
#
# private_dns_zone_group {
#   name = "postgres-dns-group"
#   private_dns_zone_ids = [
#     azurerm_private_dns_zone.postgres.id
#   ]
# }
#
# Likewise, the Key Vault private endpoint uses:
#
# private_dns_zone_group {
#   name = "keyvault-dns-group"
#   private_dns_zone_ids = [
#     azurerm_private_dns_zone.keyvault.id
#   ]
# }