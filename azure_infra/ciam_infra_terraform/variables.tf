variable "azure_tenant_id" {
  description = "The Azure Active Directory tenant ID used for authentication and resource access."
  type        = string
}

variable "project_name" {
  description = "The name of the project used for naming and tagging Azure resources."
  type        = string
  default     = "pdf-converter"
}

variable "frontend_redirect_uris" {
  description = "List of allowed redirect URIs for the frontend application authentication flow."
  type        = list(string)

  default = [
    "https://www.convertpdf.cribr.co.uk/dashboard",
    "https://www.convertpdf.cribr.co.uk/",
    "https://www.pdfconverterpro.cribr.co.uk/",
    "https://login.cribr.co.uk/"
  ]
}

variable "frontend_logout_url" {
  description = "Front-end logout URL."
  type        = string

  default = "https://www.pdfconverterpro.cribr.co.uk/"
}

variable "azure_location" {
  description = "Azure region used for CIAM infrastructure resources."
  type        = string

  default = "UK South"
}

variable "ciam_tenant_domain" {
  description = "External ID tenant domain."
  type        = string

  default = "cribrciam.onmicrosoft.com"
}

variable "ciam_tenant_subdomain" {
  description = "External ID tenant subdomain used with ciamlogin.com."
  type        = string

  default = "cribrciam"
}