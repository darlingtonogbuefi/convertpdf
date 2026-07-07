# azure_infra/CIAM_infra_terraform/spa-app.tf

resource "azuread_application" "spa" {

  display_name     = "azure-${var.project_name}-spa"
  sign_in_audience = "AzureADMyOrg"

  api {
    requested_access_token_version = 2
  }

  single_page_application {

    redirect_uris = var.frontend_redirect_uris
  }

  web {

    implicit_grant {
      access_token_issuance_enabled = true
      id_token_issuance_enabled     = true
    }
  }

  required_resource_access {

    resource_app_id = azuread_application.api.client_id

    resource_access {

      id   = azuread_application_permission_scope.api_scope.scope_id
      type = "Scope"
    }
  }
}

resource "azuread_service_principal" "spa" {

  client_id = azuread_application.spa.client_id
}