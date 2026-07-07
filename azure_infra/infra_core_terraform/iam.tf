# azure_infra\infra_core_terraform\iam.tf


# ------------------------------------------------------------------
# Azure RBAC for App Service Managed Identity + GitHub OIDC
# ------------------------------------------------------------------

# ------------------------------------------------------------------
# Storage access (Blob)
# App Service → PRIVATE storage (uploads, converted, profile pictures)
# ------------------------------------------------------------------
resource "azurerm_role_assignment" "storage" {
  scope                = azurerm_storage_account.private.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}

# ------------------------------------------------------------------
# Service Bus access
# ------------------------------------------------------------------
resource "azurerm_role_assignment" "servicebus" {
  scope                = azurerm_servicebus_namespace.sb.id

  role_definition_name = "Azure Service Bus Data Owner"

  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}

# ------------------------------------------------------------------
# Key Vault access
# ------------------------------------------------------------------
resource "azurerm_role_assignment" "kv" {
  scope                = azurerm_key_vault.kv.id

  role_definition_name = "Key Vault Secrets User"

  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}

# ------------------------------------------------------------------
# ACR pull access (ONLY if using Managed Identity)
# ------------------------------------------------------------------
resource "azurerm_role_assignment" "acr_pull" {
  count = var.use_managed_identity_acr ? 1 : 0

  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}

# ------------------------------------------------------------------
# GitHub Actions OIDC: Storage Blob Data Contributor
# Frontend deploy → STATIC storage account ($web)
# ------------------------------------------------------------------
resource "azurerm_role_assignment" "github_storage" {
  scope                = azurerm_storage_account.static.id

  role_definition_name = "Storage Blob Data Contributor"

  principal_id         = azuread_service_principal.github.object_id
}