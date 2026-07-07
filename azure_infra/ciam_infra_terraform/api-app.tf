# azure_infra/CIAM_infra_terraform/api-app.tf

resource "azuread_application" "api" {

  display_name     = "azure-${var.project_name}-api"
  sign_in_audience = "AzureADMyOrg"

  identifier_uris = [
    local.api_identifier_uri
  ]

  api {
    requested_access_token_version = 2
  }
}

resource "azuread_service_principal" "api" {

  client_id = azuread_application.api.client_id
}

resource "azuread_application_permission_scope" "api_scope" {

  application_id = azuread_application.api.id

  scope_id = uuid()

  value = local.api_scope_name

  admin_consent_display_name = "Access PDF Converter API"

  admin_consent_description = "Allows the application to access PDF Converter API"

  type = "User"
}