# azure_infra\infra_core_terraform\outputs.tf

# ------------------------------------------------------------------
# File: azure_infra/infra_core_terraform/outputs.tf
# ------------------------------------------------------------------
# Terraform Outputs
# ------------------------------------------------------------------

# ------------------------------------------------------------------
# Frontend Static Website URL
# NOTE: legacy reference preserved (DO NOT REMOVE)
# FIX: should point to STATIC storage account
# ------------------------------------------------------------------
output "frontend_url" {
  description = "Primary static website endpoint for frontend hosting"

  value = azurerm_storage_account.static.primary_web_endpoint
}

# ------------------------------------------------------------------
# Storage Account Name
# NOTE: FIXED to private storage account (backend data)
# ------------------------------------------------------------------
output "storage_account_name" {
  description = "Name of the private storage account used for uploads, converted files, and profile pictures"

  value = azurerm_storage_account.private.name
}

# ------------------------------------------------------------------
# Azure CDN Endpoint
# ------------------------------------------------------------------
output "cdn_url" {
  description = "Azure Front Door endpoint URL used as the global entry point for frontend traffic"

  value = "https://${azurerm_cdn_frontdoor_endpoint.frontend.name}.azurefd.net"
}

# ------------------------------------------------------------------
# API Management Gateway URL
# ------------------------------------------------------------------
output "api_url" {
  description = "Public API Management gateway URL"

  value = azurerm_api_management.apim.gateway_url
}

# ------------------------------------------------------------------
# Backend App Service URL
# ------------------------------------------------------------------
output "app_service_url" {
  description = "Default hostname for backend App Service"

  value = azurerm_linux_web_app.api.default_hostname
}

# ------------------------------------------------------------------
# Resource Group Information
# ------------------------------------------------------------------
output "resource_group_name" {
  description = "Main workload resource group name"

  value = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Azure region where workload resources are deployed"

  value = azurerm_resource_group.main.location
}

# ------------------------------------------------------------------
# Azure Container Registry (ACR)
# ------------------------------------------------------------------
output "acr_name" {
  description = "Azure Container Registry name"

  value = azurerm_container_registry.acr.name
}

output "acr_login_server" {
  description = "Docker login server for Azure Container Registry"

  value = azurerm_container_registry.acr.login_server
}

# ------------------------------------------------------------------
# Subscription Information
# ------------------------------------------------------------------
output "management_subscription_id" {
  description = "Azure subscription used for workload deployment"

  value = var.management_subscription_id
}

output "connectivity_subscription_id" {
  description = "Azure subscription used for connectivity resources"

  value = var.connectivity_subscription_id
}

# ------------------------------------------------------------------
# Tenant Information
# ------------------------------------------------------------------
output "tenant_id" {
  description = "Azure Active Directory tenant ID"

  value = data.azurerm_client_config.current.tenant_id
}

output "client_object_id" {
  description = "Object ID of the authenticated Azure client"

  value = data.azurerm_client_config.current.object_id
}

output "azure_client_id" {
  description = "Client ID of the Azure AD application"

  value = azuread_application.github.client_id
}

# ------------------------------------------------------------------
# Spoke Virtual Network ID
# ------------------------------------------------------------------
output "spoke_vnet_id" {
  description = "Resource ID of the spoke virtual network"

  value = azurerm_virtual_network.spoke.id
}

# ------------------------------------------------------------------
# App Subnet ID
# ------------------------------------------------------------------
output "app_subnet_id" {
  description = "Resource ID of the application subnet in the spoke VNet"

  value = azurerm_subnet.app.id
}

# ------------------------------------------------------------------
# Private Endpoint Subnet ID
# ------------------------------------------------------------------
output "private_endpoint_subnet_id" {
  description = "Resource ID of the private endpoint subnet in the spoke VNet"

  value = azurerm_subnet.private_endpoints.id
}

# ------------------------------------------------------------------
# Hub Virtual Network ID
# ------------------------------------------------------------------
output "hub_vnet_id" {
  description = "Resource ID of the existing ALZ hub virtual network"

  value = data.azurerm_virtual_network.hub.id
}

# ------------------------------------------------------------------
# Storage Account ID
# NOTE: FIXED (was referencing old storage account)
# ------------------------------------------------------------------
output "storage_account_id" {
  description = "Azure Storage Account ID (private storage account)"

  value = azurerm_storage_account.private.id
}

# ------------------------------------------------------------------
# Uploads Container
# ------------------------------------------------------------------
output "uploads_container_name" {
  description = "Container used for original uploaded files"

  value = azurerm_storage_container.uploads.name
}

output "uploads_container_id" {
  description = "Uploads container resource ID"

  value = azurerm_storage_container.uploads.id
}

# ------------------------------------------------------------------
# Converted Container
# ------------------------------------------------------------------
output "converted_container_name" {
  description = "Container used for converted output files"

  value = azurerm_storage_container.converted.name
}

output "converted_container_id" {
  description = "Converted container resource ID"

  value = azurerm_storage_container.converted.id
}

# ------------------------------------------------------------------
# Blob Container URLs
# NOTE: FIXED to private storage account
# ------------------------------------------------------------------
output "uploads_container_url" {
  description = "Uploads blob container URL"

  value = format(
    "https://%s.blob.core.windows.net/%s",
    azurerm_storage_account.private.name,
    azurerm_storage_container.uploads.name
  )
}

output "converted_container_url" {
  description = "Converted blob container URL"

  value = format(
    "https://%s.blob.core.windows.net/%s",
    azurerm_storage_account.private.name,
    azurerm_storage_container.converted.name
  )
}

output "profile_pictures_container_name" {
  description = "Container used for user profile pictures"

  value = azurerm_storage_container.profile_pictures.name
}

output "profile_pictures_container_url" {
  description = "Profile pictures blob container URL"

  value = format(
    "https://%s.blob.core.windows.net/%s",
    azurerm_storage_account.private.name,
    azurerm_storage_container.profile_pictures.name
  )
}

# ------------------------------------------------------------------
# APIM Outputs
# ------------------------------------------------------------------
output "apim_api_url" {
  description = "Base URL of the PDF API via APIM"

  value = "https://${azurerm_api_management.apim.name}.azure-api.net/${azurerm_api_management_api.api.path}"
}

#output "apim_subscription_primary_key" {
#  description = "Primary subscription key for PDF API"

#  value     = azurerm_api_management_subscription.pdf_subscription.primary_key
#  sensitive = true
#}

#output "apim_subscription_secondary_key" {
#  description = "Secondary subscription key for PDF API"

#  value     = azurerm_api_management_subscription.pdf_subscription.secondary_key
#  sensitive = true
#}

# ------------------------------------------------------------------
# Front Door Outputs
# ------------------------------------------------------------------
output "frontdoor_profile_name" {
  description = "Front Door profile name"

  value = azurerm_cdn_frontdoor_profile.fd.name
}

output "frontdoor_endpoint_name" {
  description = "Front Door endpoint name"

  value = azurerm_cdn_frontdoor_endpoint.frontend.name
}

# ------------------------------------------------------------------
# PostgreSQL Outputs
# ------------------------------------------------------------------
output "postgres_server_name" {
  description = "Name of the PostgreSQL Flexible Server"

  value = azurerm_postgresql_flexible_server.db.name
}

output "postgres_fqdn" {
  description = "FQDN of PostgreSQL server"

  value = azurerm_postgresql_flexible_server.db.fqdn
}

output "postgres_admin_username" {
  description = "PostgreSQL admin username"

  value = azurerm_postgresql_flexible_server.db.administrator_login
}

output "postgres_port_number" {
  description = "PostgreSQL port number"

  value = 5432
}

output "postgres_resource_group" {
  description = "Resource group containing PostgreSQL server"

  value = azurerm_postgresql_flexible_server.db.resource_group_name
}

output "postgres_version" {
  description = "PostgreSQL version"

  value = azurerm_postgresql_flexible_server.db.version
}

output "postgres_connection_string_example" {
  description = "Example PostgreSQL connection string (do not use in production)"

  value       = "postgresql://${var.db_user}:<password>@${azurerm_postgresql_flexible_server.db.fqdn}:5432/postgres?sslmode=require"
  sensitive   = true
}

output "postgres_database_name" {
  description = "Logical PostgreSQL database name"

  value = azurerm_postgresql_flexible_server_database.db.name
}

output "postgres_database_id" {
  description = "Logical PostgreSQL database ID"

  value = azurerm_postgresql_flexible_server_database.db.id
}

# ------------------------------------------------------------------
# CIAM Outputs
# ------------------------------------------------------------------
output "ciam_auth_domain" {
  description = "CIAM authentication domain"

  value = var.ciam_auth_domain
}

output "ciam_tenant_id" {
  description = "CIAM tenant ID"

  value = var.ciam_tenant_id
}

output "ciam_openid_configuration_url" {
  description = "CIAM OpenID configuration endpoint"

  value = "https://${var.ciam_auth_domain}/${var.ciam_tenant_id}/v2.0/.well-known/openid-configuration"
}

output "ciam_authorize_endpoint" {
  description = "CIAM OAuth authorize endpoint"

  value = "https://${var.ciam_auth_domain}/${var.ciam_tenant_id}/oauth2/v2.0/authorize"
}

output "ciam_token_endpoint" {
  description = "CIAM OAuth token endpoint"

  value = "https://${var.ciam_auth_domain}/${var.ciam_tenant_id}/oauth2/v2.0/token"
}

output "ciam_frontdoor_login_url_example" {
  description = "Example login URL via Front Door"

  value = "https://${var.ciam_auth_domain}/${var.ciam_tenant_id}/oauth2/v2.0/authorize?p=B2C_1_susi"
}


###########################################################
# POSTGRES PRIVATE DNS DIAGNOSTICS (CLEANED)
###########################################################

output "postgres_private_dns_zone_group_id" {
  value = "managed-inside-private-endpoint"
}

output "postgres_dns_wiring_status" {
  value = {
    fqdn = azurerm_postgresql_flexible_server.db.fqdn

    private_endpoint_exists = try(azurerm_private_endpoint.postgres.id, null) != null

    private_dns_zone_exists = try(azurerm_private_dns_zone.postgres.id, null) != null

    # This is always true IF you've added the nested block in the private endpoint
    private_dns_zone_group_attached = true

    vnet_link_exists = try(azurerm_private_dns_zone_virtual_network_link.postgres.id, null) != null

    public_access_enabled = azurerm_postgresql_flexible_server.db.public_network_access_enabled
  }
}



###########################################################
# STORAGE PRIVATE ACCESS STATUS (CLEAN DIAGNOSTICS)
###########################################################

output "storage_private_access_status" {
  description = "High-level validation of storage private access configuration"

  value = {
    storage_account_name = azurerm_storage_account.private.name

    public_access_enabled = azurerm_storage_account.private.public_network_access_enabled

    private_endpoint_hint = "Check storage.tf for azurerm_private_endpoint linking to this account"

    containers_private = [
      azurerm_storage_container.uploads.name,
      azurerm_storage_container.converted.name,
      azurerm_storage_container.profile_pictures.name
    ]
  }
}