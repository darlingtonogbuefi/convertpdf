# azure_infra/infra_core_terraform/frontdoor_cdn.tf



# ============================================================
# AZURE FRONT DOOR PROFILE
# ============================================================
resource "azurerm_cdn_frontdoor_profile" "fd" {
  name                = "${var.project_name}-fd"
  resource_group_name = azurerm_resource_group.main.name
  sku_name            = "Premium_AzureFrontDoor"
}

# ============================================================
# FRONT DOOR ENDPOINT
# ============================================================
resource "azurerm_cdn_frontdoor_endpoint" "frontend" {
  name                     = "frontend"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd.id
}

# ============================================================
# ORIGIN GROUP (SPA)
# ============================================================
resource "azurerm_cdn_frontdoor_origin_group" "frontend" {
  name                     = "origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd.id

  session_affinity_enabled = false

  load_balancing {
    sample_size                        = 4
    successful_samples_required        = 3
    additional_latency_in_milliseconds = 50
  }

  health_probe {
    path                = "/"
    request_type        = "GET"
    protocol            = "Https"
    interval_in_seconds = 120
  }
}

# ============================================================
# SPA ORIGIN (STORAGE)
# ============================================================
resource "azurerm_cdn_frontdoor_origin" "frontend" {
  name                          = "storage-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.frontend.id

  enabled = true

  host_name = replace(
    replace(azurerm_storage_account.static.primary_web_endpoint, "https://", ""),
    "/",
    ""
  )

  origin_host_header = replace(
    replace(azurerm_storage_account.static.primary_web_endpoint, "https://", ""),
    "/",
    ""
  )

  http_port  = 80
  https_port = 443

  priority = 1
  weight   = 1000

  certificate_name_check_enabled = false
}

# ============================================================
# CIAM ORIGIN GROUP
# ============================================================
resource "azurerm_cdn_frontdoor_origin_group" "ciam" {
  name                     = "ciam-origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd.id

  session_affinity_enabled = false

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
  }

  health_probe {
    path                = "/"
    request_type        = "GET"
    protocol            = "Https"
    interval_in_seconds = 120
  }
}

# ============================================================
# CIAM ORIGIN (ENTRA EXTERNAL ID BACKEND) — FIXED
# ============================================================
resource "azurerm_cdn_frontdoor_origin" "ciam" {
  name                          = "ciam-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.ciam.id

  enabled = true

  host_name          = "cribrciam.ciamlogin.com"
  origin_host_header = "cribrciam.ciamlogin.com"

  http_port  = 80
  https_port = 443

  priority = 1
  weight   = 1000

  certificate_name_check_enabled = true
}

# ============================================================
# ✅ NEW: APIM ORIGIN GROUP (ADDED)
# ============================================================
resource "azurerm_cdn_frontdoor_origin_group" "apim" {
  name                     = "apim-origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd.id

  session_affinity_enabled = false

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
  }

  health_probe {
    path                = "/status-0123456789abcdef" # APIM health endpoint (safe default pattern)
    request_type        = "GET"
    protocol            = "Https"
    interval_in_seconds = 120
  }
}

# ============================================================
# ✅ NEW: APIM ORIGIN (ADDED)
# ============================================================
resource "azurerm_cdn_frontdoor_origin" "apim" {
  name                          = "apim-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.apim.id

  enabled = true

  host_name          = var.apim_gateway_host
  origin_host_header = var.apim_gateway_host

  http_port  = 80
  https_port = 443

  priority = 1
  weight   = 1000

  certificate_name_check_enabled = true
}

# ============================================================
# SPA RULE SET
# ============================================================
resource "azurerm_cdn_frontdoor_rule_set" "spa" {
  name                     = "spa1"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd.id
}

resource "azurerm_cdn_frontdoor_rule" "spa_fallback" {
  name                      = "spafallback"
  cdn_frontdoor_rule_set_id = azurerm_cdn_frontdoor_rule_set.spa.id
  order                     = 1

  behavior_on_match = "Continue"

  conditions {
    request_uri_condition {
      operator = "RegEx"

      match_values = [
        "\\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|map|txt)$"
      ]

      negate_condition = true
    }
  }

  actions {
    url_rewrite_action {
      source_pattern          = "/*"
      destination             = "/index.html"
      preserve_unmatched_path = false
    }
  }
}

# ============================================================
# FRONTEND DOMAINS
# ============================================================
resource "azurerm_cdn_frontdoor_custom_domain" "pdfconverterpro" {
  name                     = "pdfconverterpro-www-domain"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd.id

  host_name = "www.pdfconverterpro.cribr.co.uk"

  tls {
    certificate_type    = "ManagedCertificate"
    minimum_tls_version = "TLS12"
  }
}

resource "azurerm_cdn_frontdoor_custom_domain" "convertpdf" {
  name                     = "convertpdf-www-domain"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd.id

  host_name = "www.convertpdf.cribr.co.uk"

  tls {
    certificate_type    = "ManagedCertificate"
    minimum_tls_version = "TLS12"
  }
}

# ============================================================
# CIAM CUSTOM DOMAIN (NO DNS MANAGEMENT HERE)
# ============================================================
resource "azurerm_cdn_frontdoor_custom_domain" "ciam_login" {
  name                     = "ciam-login-domain"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.fd.id

  host_name = var.ciam_auth_domain

  tls {
    certificate_type    = "ManagedCertificate"
    minimum_tls_version = "TLS12"
  }
}

# ============================================================
# ROUTE - SPA
# ============================================================
resource "azurerm_cdn_frontdoor_route" "frontend" {
  name                      = "frontend-route"
  cdn_frontdoor_endpoint_id = azurerm_cdn_frontdoor_endpoint.frontend.id

  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.frontend.id

  cdn_frontdoor_origin_ids = [
    azurerm_cdn_frontdoor_origin.frontend.id
  ]

  cdn_frontdoor_rule_set_ids = [
    azurerm_cdn_frontdoor_rule_set.spa.id
  ]

  cdn_frontdoor_custom_domain_ids = [
    azurerm_cdn_frontdoor_custom_domain.pdfconverterpro.id,
    azurerm_cdn_frontdoor_custom_domain.convertpdf.id
  ]

  supported_protocols = ["Http", "Https"]

  patterns_to_match = ["/*"]

  forwarding_protocol    = "HttpsOnly"
  https_redirect_enabled = true
  link_to_default_domain = true

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================
# ROUTE - CIAM
# ============================================================
resource "azurerm_cdn_frontdoor_route" "ciam" {
  name                      = "ciam-route"
  cdn_frontdoor_endpoint_id = azurerm_cdn_frontdoor_endpoint.frontend.id

  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.ciam.id

  cdn_frontdoor_origin_ids = [
    azurerm_cdn_frontdoor_origin.ciam.id
  ]

  cdn_frontdoor_custom_domain_ids = [
    azurerm_cdn_frontdoor_custom_domain.ciam_login.id
  ]

  supported_protocols = ["Https"]

  forwarding_protocol = "HttpsOnly"

  https_redirect_enabled = false

  patterns_to_match = ["/*"]

  link_to_default_domain = false

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================
# ROUTE - API (FORCES APIM IN THE PATH)
# ============================================================
resource "azurerm_cdn_frontdoor_route" "api" {
  name                      = "api-route"
  cdn_frontdoor_endpoint_id = azurerm_cdn_frontdoor_endpoint.frontend.id

  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.apim.id

  cdn_frontdoor_origin_ids = [
    azurerm_cdn_frontdoor_origin.apim.id
  ]

  supported_protocols = ["Http", "Https"]

  forwarding_protocol    = "HttpsOnly"
  https_redirect_enabled = true

  patterns_to_match = ["/api/*"]

  link_to_default_domain = true
}

# ============================================================
# IMPORTANT: DNS IS NOW VERCEL-OWNED (NOT AZURE)
# ============================================================
# DO NOT create azurerm_dns_zone or cname for login domain
# ============================================================
