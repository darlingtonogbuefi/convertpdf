#  azure_infra\infra_core_terraform\apim.tf


# ------------------------------------------------------------------
# File: azure_infra/infra_core_terraform/apim.tf
# ------------------------------------------------------------------

# ---------------------------
# API Management Service
# ---------------------------
resource "azurerm_api_management" "apim" {
  name                = "${var.project_name}-apim"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  publisher_name  = "cribr"
  publisher_email = "darlington.ogbuefi@cribr.co.uk"

  sku_name = "Consumption_0"
}


# ---------------------------
# Random shared secret used by APIM -> FastAPI
# ---------------------------
resource "random_password" "apim_backend_secret" {
  length  = 64
  special = false
}


# ---------------------------
# APIM Named Value (stored securely in APIM)
# ---------------------------
resource "azurerm_api_management_named_value" "backend_secret" {

  name                = "backend-secret"
  display_name        = "backend-secret"

  api_management_name = azurerm_api_management.apim.name
  resource_group_name = azurerm_resource_group.main.name

  secret = true
  value  = random_password.apim_backend_secret.result
}


# ---------------------------
# API
# ---------------------------
resource "azurerm_api_management_api" "api" {

  name                = "pdfconverterpro-api"
  resource_group_name = azurerm_resource_group.main.name
  api_management_name = azurerm_api_management.apim.name

  revision     = "1"
  display_name = "PDF API"

  # FastAPI already contains /api routes
  # Example:
  # /api/convert/pdf-to-word
  path = ""

  protocols = ["https"]

  subscription_required = false


  service_url = "https://${azurerm_linux_web_app.api.default_hostname}"


  import {
    content_format = "openapi+json"
    content_value  = file("${path.module}/openapi.json")
  }
}



# ---------------------------
# API Policy
# CORS + Optional JWT + Backend Secret
# ---------------------------
resource "azurerm_api_management_api_policy" "pdf_api_policy" {

  api_name            = azurerm_api_management_api.api.name
  api_management_name = azurerm_api_management.apim.name
  resource_group_name = azurerm_resource_group.main.name


  xml_content = <<XML
<policies>

    <inbound>

        <base />


        <!-- Handle browser OPTIONS preflight -->

        <choose>

            <when condition="@(context.Request.Method == "OPTIONS")">

                <return-response>

                    <set-status code="200" reason="OK" />


                    <set-header name="Access-Control-Allow-Origin" exists-action="override">
                        <value>https://www.convertpdf.cribr.co.uk</value>
                    </set-header>


                    <set-header name="Access-Control-Allow-Methods" exists-action="override">
                        <value>GET, POST, PUT, DELETE, OPTIONS</value>
                    </set-header>


                    <set-header name="Access-Control-Allow-Headers" exists-action="override">
                        <value>Authorization, Content-Type, x-guest-id</value>
                    </set-header>


                    <set-header name="Access-Control-Allow-Credentials" exists-action="override">
                        <value>true</value>
                    </set-header>


                </return-response>

            </when>

        </choose>



        <!-- CORS -->

        <cors allow-credentials="true">

            <allowed-origins>

                <origin>https://frontend.azurefd.net</origin>
                <origin>https://www.pdfconverterpro.cribr.co.uk</origin>
                <origin>https://www.convertpdf.cribr.co.uk</origin>
                <origin>https://login.cribr.co.uk</origin>

            </allowed-origins>


            <allowed-methods>

                <method>GET</method>
                <method>POST</method>
                <method>PUT</method>
                <method>DELETE</method>
                <method>OPTIONS</method>

            </allowed-methods>


            <allowed-headers>

                <header>*</header>

            </allowed-headers>


            <expose-headers>

                <header>*</header>

            </expose-headers>


        </cors>



        <!--
            Validate CIAM JWT only when Authorization header exists.
            Guest users using x-guest-id bypass JWT.
        -->

        <choose>

            <when condition="@(context.Request.Headers.ContainsKey("Authorization"))">


                <validate-jwt

                    header-name="Authorization"

                    require-scheme="Bearer"

                    require-expiration-time="true"

                    require-signed-tokens="true"

                    output-token-variable-name="jwt">


                    <openid-config url="https://cribrciam.ciamlogin.com/29739999-77b0-460b-9b2f-d3373a38b179/v2.0/.well-known/openid-configuration" />


                    <audiences>

                        <audience>${var.ciam_api_client_id}</audience>

                    </audiences>


                    <required-claims>

                        <claim name="scp">

                            <value>access_as_user</value>

                        </claim>

                    </required-claims>


                </validate-jwt>


            </when>


        </choose>



        <!-- Inject APIM secret for FastAPI -->

        <set-header

            name="X-APIM-Secret"

            exists-action="override">


            <value>{{backend-secret}}</value>


        </set-header>


    </inbound>



    <backend>

        <base />

    </backend>



    <outbound>

        <base />

    </outbound>



    <on-error>

        <base />

    </on-error>


</policies>
XML

}



# ---------------------------
# API Product
# ---------------------------
resource "azurerm_api_management_product" "pdf_product" {

  product_id            = "pdf-product"

  api_management_name   = azurerm_api_management.apim.name

  resource_group_name   = azurerm_resource_group.main.name


  display_name          = "PDF API Product"

  approval_required     = false

  subscription_required = false

  published             = true

}