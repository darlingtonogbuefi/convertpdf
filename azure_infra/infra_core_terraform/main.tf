#  azure_infra\infra_core_terraform\main.tf

# ------------------------------------------------------------------
# File: azure_infra\infra_core_terraform\main.tf
# ------------------------------------------------------------------
# Terraform configuration
# Defines required Terraform version and provider plugins
# Also configures the remote backend for storing state in Azure
# ------------------------------------------------------------------
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.50"
    }
  }

  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "pdfconvprodtfstate01"
    container_name       = "tfstate"
    key                  = "infra_core.tfstate"
  }
}

###########################################################
# PROVIDERS (WORKLOAD + CONNECTIVITY SUBSCRIPTIONS)
###########################################################

provider "azurerm" {
  features {}
  subscription_id = var.management_subscription_id
}

provider "azurerm" {
  alias           = "connectivity"
  features        {}
  subscription_id = var.connectivity_subscription_id
}

provider "azuread" {}

data "azurerm_client_config" "current" {}

###########################################################
# MAIN RESOURCE GROUP (WORKLOAD)
###########################################################

resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-rg"
  location = var.location
}

###########################################################
# ACR (WORKLOAD)
###########################################################

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  sku           = "Basic"
  admin_enabled = false
}