# azure_infra\infra_core_terraform\servicebus.tf


# ------------------------------------------------------------------
# File: azure_infra/infra_core_terraform/servicebus.tf
# ------------------------------------------------------------------
# Azure Service Bus
# Messaging system (replacement for AWS SQS)
# ------------------------------------------------------------------

locals {
  # Service Bus namespace names cannot end with:
  # - hyphen (-)
  # -sb
  # -mgmt
  #
  # Using "-sbns" avoids the reserved suffix restriction.
  sb_namespace_name = replace("${var.project_name}-sbns", "_", "-")
}

resource "azurerm_servicebus_namespace" "sb" {
  name                = local.sb_namespace_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = var.servicebus_sku
}