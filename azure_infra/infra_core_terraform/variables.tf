#  azure_infra\infra_core_terraform\variables.tf


###########################################################
# Project
###########################################################
variable "project_name" {
  description = "Base name used for all Azure resources"
  type        = string
  default     = "pdfconvertpro"
}

###########################################################
# Azure Region
###########################################################
variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "UK South"
}

###########################################################
# Environment (missing in your current setup)
###########################################################
variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

###########################################################
# Database Credentials
###########################################################
variable "db_user" {
  description = "PostgreSQL admin username"
  type        = string
}

variable "db_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the PostgreSQL database used by the application"
  default = "converter"
}

###########################################################
# Container Registry
###########################################################
variable "acr_name" {
  description = "Azure Container Registry name"
  type        = string
  default     = "pdfconvertacr123"
}

###########################################################
# API Management (APIM)
###########################################################
variable "apim_publisher_name" {
  description = "APIM publisher name"
  type        = string
  default     = "pdfconvertpro"
}

variable "apim_publisher_email" {
  description = "APIM publisher email"
  type        = string
}

###########################################################
# Service Bus (Azure equivalent of SQS)
###########################################################
variable "servicebus_sku" {
  description = "Service Bus SKU"
  type        = string
  default     = "Standard"
}

###########################################################
# External API (Nutrient)
###########################################################
variable "nutrient_api_key" {
  description = "API key for Nutrient service"
  type        = string
  sensitive   = true
}

variable "nutrient_base_url" {
  description = "Base URL for Nutrient API"
  type        = string
}

variable "nutrient_session_url" {
  description = "Session endpoint for Nutrient API"
  type        = string
}

variable "nutrient_sign_url" {
  description = "Signing endpoint for Nutrient API"
  type        = string
}

###########################################################
# Optional: App Service settings
###########################################################
variable "app_service_sku" {
  description = "SKU for App Service Plan"
  type        = string
  default     = "B2"
}


###########################################################
# GitHub OIDC (Federated Identity)
###########################################################
variable "github_oidc_repo" {
  description = "GitHub OIDC subject for Azure federated identity (repo:OWNER/REPO:*)"
  type        = string
  default = "repo:darlingtonogbuefi/pdfconverterpro:ref:refs/heads/main"
}

###########################################################
# Azure subscription ID for workload deployment # Target Subscription ID in Azure Landing Zone (Management subscription ID)
###########################################################
variable "management_subscription_id" {
  description = "Target workload subscription"
  type        = string
}


###########################################################
# Azure subscription ID for Connectivity subscription (Hub)
###########################################################
variable "connectivity_subscription_id" {
  description = "Connectivity subscription ID (hub resources)."
  type        = string
}


# -----------------------------
# Azure Container Registry info
# -----------------------------

variable "acr_login_server" {
  description = "The login server URL of the Azure Container Registry (e.g., pdfconvertacr123.azurecr.io)"
  type        = string
}

variable "acr_username" {
  description = "Username for Azure Container Registry (usually the ACR admin username)"
  type        = string
  sensitive   = true
}

variable "acr_password" {
  description = "Password for Azure Container Registry (primary or secondary key)"
  type        = string
  sensitive   = true
}

variable "use_managed_identity_acr" {
  type        = bool
  default     = true
  description = "If true, the App Service uses Managed Identity (AcrPull role) for ACR authentication. If false, it falls back to ACR admin username/password credentials."
}


###########################################################
# CIAM Authentication Domain
# Used by Azure Front Door to route authentication traffic
###########################################################

variable "ciam_auth_domain" {
  description = "Custom domain used for Microsoft Entra External ID (CIAM) authentication endpoints routed through Azure Front Door (e.g. login.cribr.co.uk)"
  type        = string
  default     = "login.cribr.co.uk"
}

###########################################################
# CIAM Tenant ID (External ID Directory Object)
# Used in authentication URL paths and routing rules
###########################################################

variable "ciam_tenant_id" {
  description = "Microsoft Entra External ID tenant GUID used in OAuth/OpenID authentication URL paths (e.g. 29739999-77b0-460b-9b2f-d3373a38b179)"
  type        = string
  default     = "29739999-77b0-460b-9b2f-d3373a38b179"
}


# ------------------------------------------------------------------
# CIAM API Client ID
# ------------------------------------------------------------------
# The Azure AD Application (client) ID used by the CIAM API.
# This identifies the application when requesting tokens or
# authenticating against Azure services.

variable "ciam_api_client_id" {
  description = "CIAM API application (client) ID used as JWT audience"
  type        = string
}




# ------------------------------------------------------------------
# APIM Gateway Hostname
# ------------------------------------------------------------------
# The hostname of the Azure API Management (APIM) gateway.
# This must NOT include "https://" or any path — only the raw domain.
#
# Example:
# pdfconvertpro-apim.azure-api.net
#
# This value is used by Azure Front Door to route API traffic
# to the APIM instance, which then forwards requests to the backend
# services (e.g., App Service).
# ------------------------------------------------------------------


variable "apim_gateway_host" {
  description = "APIM gateway hostname (no https prefix)"
  type        = string
}



###########################################################
# Storage Accounts (NEW ARCHITECTURE)
###########################################################

variable "static_storage_account_name" {
  description = "Storage account used for static website hosting (frontend)"
  type        = string
  default     = "pdfconvertstatic123"
}

variable "private_storage_account_name" {
  description = "Storage account used for private backend data (uploads, converted files)"
  type        = string
  default     = "pdfconvertprivate123"
}