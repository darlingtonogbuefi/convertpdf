terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }

    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azuread" {
  tenant_id = var.azure_tenant_id
}

#provider "azurerm" {
#  features {}
#
#  tenant_id = var.azure_tenant_id
#}

locals {
  api_scope_name     = "access_as_user"
  api_identifier_uri = "api://${var.project_name}-api"

  authority_url = "https://${var.ciam_tenant_subdomain}.ciamlogin.com/${var.ciam_tenant_domain}"
}

# ============================================================================
# CIAM Resource Group
# ============================================================================

#resource "azurerm_resource_group" "ciam" {
#  name     = "rg-${var.project_name}-ciam"
#  location = var.azure_location
#}

# ============================================================================
# Backend API Secret
# ============================================================================

resource "azuread_application_password" "api_secret" {
  application_id = azuread_application.api.id
  display_name   = "azure-api-secret"
}