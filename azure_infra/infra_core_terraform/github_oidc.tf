#  azure_infra\infra_core_terraform\github_oidc.tf

# ------------------------------------------------------------------
# Azure AD Application
# ------------------------------------------------------------------
resource "azuread_application" "github" {
  display_name = "${var.project_name}-github"
}

# ------------------------------------------------------------------
# Service Principal
# ------------------------------------------------------------------
resource "azuread_service_principal" "github" {
  client_id = azuread_application.github.client_id
}

# ------------------------------------------------------------------
# Federated Identity Credential (OIDC)
# ------------------------------------------------------------------
resource "azuread_application_federated_identity_credential" "github" {
  application_id = azuread_application.github.id

  display_name = "github-actions"

  issuer    = "https://token.actions.githubusercontent.com"
  subject   = var.github_oidc_repo
  audiences = ["api://AzureADTokenExchange"]
}

# ------------------------------------------------------------------
# Permissions for Terraform deployment
# ------------------------------------------------------------------
resource "azurerm_role_assignment" "github" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.github.object_id
}