# azure_infra\infra_core_terraform\networking.tf

###########################################################
# HUB VNET (CONNECTIVITY SUBSCRIPTION)
###########################################################

data "azurerm_virtual_network" "hub" {
  provider = azurerm.connectivity

  name                = "vnet-hub-uksouth"
  resource_group_name = "rg-hub-uksouth"
}

###########################################################
# SPOKE RESOURCE GROUP (WORKLOAD)
###########################################################

resource "azurerm_resource_group" "spoke_network" {
  name     = "rg-spoke-${var.project_name}-${var.environment}"
  location = var.location

  tags = {
    role   = "spoke-network"
    source = "terraform"
  }
}

###########################################################
# SPOKE VNET (WORKLOAD)
###########################################################

resource "azurerm_virtual_network" "spoke" {
  name                = "vnet-spoke-${var.project_name}-${var.environment}"
  location            = azurerm_resource_group.spoke_network.location
  resource_group_name = azurerm_resource_group.spoke_network.name

  address_space = ["10.10.0.0/16"]

  tags = {
    role = "spoke-vnet"
  }
}

###########################################################
# APP SUBNET (WORKLOAD)
###########################################################

resource "azurerm_subnet" "app" {
  name                 = "snet-app"
  resource_group_name  = azurerm_resource_group.spoke_network.name
  virtual_network_name = azurerm_virtual_network.spoke.name

  address_prefixes = ["10.10.1.0/24"]

  ###########################################################
  # REQUIRED FOR APP SERVICE VNET INTEGRATION
  ###########################################################
  delegation {
    name = "appservice-delegation"

    service_delegation {
      name = "Microsoft.Web/serverFarms"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/action"
      ]
    }
  }
}

###########################################################
# PRIVATE ENDPOINT SUBNET (FIXED)
###########################################################

resource "azurerm_subnet" "private_endpoints" {
  name                 = "snet-private-endpoints"
  resource_group_name  = azurerm_resource_group.spoke_network.name
  virtual_network_name = azurerm_virtual_network.spoke.name

  address_prefixes = ["10.10.2.0/24"]

  private_endpoint_network_policies = "Disabled"
}

###########################################################
# SPOKE → HUB PEERING (WORKLOAD SUBSCRIPTION)
###########################################################

resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  name                  = "peer-spoke-to-hub"
  resource_group_name   = azurerm_resource_group.spoke_network.name
  virtual_network_name  = azurerm_virtual_network.spoke.name

  remote_virtual_network_id = data.azurerm_virtual_network.hub.id

  allow_forwarded_traffic = true
  allow_gateway_transit   = false
  use_remote_gateways     = false
}

###########################################################
# HUB → SPOKE PEERING (CONNECTIVITY SUBSCRIPTION)
###########################################################

resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  provider = azurerm.connectivity

  name                  = "peer-hub-to-spoke"
  resource_group_name   = "rg-hub-uksouth"
  virtual_network_name  = data.azurerm_virtual_network.hub.name

  remote_virtual_network_id = azurerm_virtual_network.spoke.id

  allow_forwarded_traffic = true
  allow_gateway_transit   = true
  use_remote_gateways     = false
}