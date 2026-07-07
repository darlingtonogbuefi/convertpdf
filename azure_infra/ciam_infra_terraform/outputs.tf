#  azure_infra\ciam_infra_terraform\outputs.tf

output "azure_spa_client_id" {
  description = "Application (client) ID for the Azure Entra SPA/frontend application registration."

  value = azuread_application.spa.client_id
}

output "azure_api_client_id" {
  description = "Application (client) ID for the Azure Entra backend API application registration."

  value = azuread_application.api.client_id
}

output "azure_tenant_id" {
  description = "Azure Entra tenant ID used for authentication and authorization."

  value = var.azure_tenant_id
}

output "azure_authority_url" {
  description = "OAuth/OpenID Connect authority URL used by MSAL and token validation."

  value = local.authority_url
}

output "azure_api_scope" {
  description = "Full delegated API scope URI exposed by the backend API application."

  value = "${local.api_identifier_uri}/${local.api_scope_name}"
}

output "azure_api_client_secret" {
  description = "Client secret for the backend API application registration."

  value = azuread_application_password.api_secret.value

  sensitive = true
}


#output "azure_ciam_resource_group_name" {
#  description = "Azure Resource Group name containing the CIAM-related infrastructure resources."
#
#  value = azurerm_resource_group.ciam.name
#}

#output "azure_ciam_location" {
#  description = "Azure region where the CIAM infrastructure resources are deployed."
#
#  value = azurerm_resource_group.ciam.location
#}

## output "azure_ciam_managed_identity_client_id" {
#  description = "Client ID of the user-assigned managed identity used by CIAM-integrated services to access Azure resources."
#
#  value = azurerm_user_assigned_identity.ciam.client_id
#}
#
#output "azure_ciam_key_vault_name" {
#  description = "Name of the Azure Key Vault used to store CIAM application secrets, certificates, and configuration values."
#
#  value = azurerm_key_vault.ciam.name
#}
#
#output "azure_ciam_key_vault_uri" {
#  description = "Vault URI endpoint of the Azure Key Vault used by CIAM-integrated applications for secret retrieval."
#
#  value = azurerm_key_vault.ciam.vault_uri
#}