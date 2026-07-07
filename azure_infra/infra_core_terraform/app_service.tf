#  azure_infra\infra_core_terraform\app_service.tf


# ------------------------------------------------------------------
# File: azure_infra/infra_core_terraform/app_service.tf
# ------------------------------------------------------------------
# App Service Plan + Linux Web App (Docker)
# Backend FastAPI service running in container
# Supports:
# - ACR Admin username/password (fallback)
# - ACR Managed Identity (AcrPull role)
# Toggle via var.use_managed_identity_acr
# ------------------------------------------------------------------

resource "azurerm_service_plan" "plan" {
  name                = "${var.project_name}-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  os_type  = "Linux"
  sku_name = var.app_service_sku
}

# ------------------------------------------------------------------
# Linux Web App
# ------------------------------------------------------------------
resource "azurerm_linux_web_app" "api" {
  name                = "${var.project_name}-api"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.plan.id

  https_only = true

  # ✅ Private Vnet integration (App Service Environment v3)
  virtual_network_subnet_id = azurerm_subnet.app.id

  # Prevent Terraform from overwriting container image
  # deployed by GitHub Actions
  lifecycle {
    ignore_changes = [
      site_config[0].application_stack
    ]
  }

  # System-assigned Managed Identity
  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = true

    # Use Managed Identity for ACR authentication
    container_registry_use_managed_identity = true

    # NOTE:
    # Container image deployment is managed by:
    # .github/workflows/azure_deploy_backend.yml
    #
    # DO NOT define application_stack here,
    # otherwise Terraform and GitHub Actions
    # will fight over image configuration
    # and can produce malformed image paths.

    cors {
      allowed_origins = [
        "https://frontend.azurefd.net",
        "https://www.pdfconverterpro.cribr.co.uk",
        "https://www.convertpdf.cribr.co.uk",
        "https://login.cribr.co.uk"
      ]

      support_credentials = true
    }
  }

  app_settings = {
    WEBSITES_PORT = "8000"

    DATABASE_URL     = "@Microsoft.KeyVault(SecretUri=https://pdfconvertprokv.vault.azure.net/secrets/database-url/)"
    NUTRIENT_API_KEY = "@Microsoft.KeyVault(SecretUri=https://pdfconvertprokv.vault.azure.net/secrets/nutrient-api-key/)"

    STORAGE_ACCOUNT_NAME = azurerm_storage_account.private.name

    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"

    ###########################################################
    # CIAM / AUTH
    ###########################################################
    CIAM_TENANT_ID      = var.ciam_tenant_id
    AZURE_API_CLIENT_ID = var.ciam_api_client_id

    ###########################################################
    # APIM -> Backend authentication
    ###########################################################
    APIM_SECRET = random_password.apim_backend_secret.result
  }
}

###########################################################
# App Service Autoscale (FIXED: now correctly OUTSIDE web app)
###########################################################

resource "azurerm_monitor_autoscale_setting" "api_autoscale" {

  name                = "${var.project_name}-autoscale"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  target_resource_id = azurerm_service_plan.plan.id

  profile {

    name = "default"

    capacity {
      default = 2
      minimum = 2
      maximum = 5
    }

    #
    # SCALE OUT
    #
    rule {

      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.plan.id

        time_grain       = "PT1M"
        statistic        = "Average"
        time_window      = "PT5M"
        time_aggregation = "Average"

        operator  = "GreaterThan"
        threshold = 70
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    #
    # SCALE IN
    #
    rule {

      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.plan.id

        time_grain       = "PT1M"
        statistic        = "Average"
        time_window      = "PT10M"
        time_aggregation = "Average"

        operator  = "LessThan"
        threshold = 30
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT10M"
      }
    }
  }
}