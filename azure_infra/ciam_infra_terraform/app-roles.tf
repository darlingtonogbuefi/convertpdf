
#  azure_infra\CIAM_infra_terraform\app-roles.tf

resource "azuread_application_app_role" "free_user" {

  application_id = azuread_application.api.id

  role_id = uuid()

  allowed_member_types = ["User"]

  display_name = "FreeUser"

  description = "Free tier user"

  value = "FreeUser"
}

resource "azuread_application_app_role" "basic_user" {

  application_id = azuread_application.api.id

  role_id = uuid()

  allowed_member_types = ["User"]

  display_name = "BasicUser"

  description = "Basic tier user"

  value = "BasicUser"
}

resource "azuread_application_app_role" "premium_user" {

  application_id = azuread_application.api.id

  role_id = uuid()

  allowed_member_types = ["User"]

  display_name = "PremiumUser"

  description = "Premium tier user"

  value = "PremiumUser"
}

resource "azuread_application_app_role" "admin_user" {

  application_id = azuread_application.api.id

  role_id = uuid()

  allowed_member_types = ["User"]

  display_name = "AdminUser"

  description = "Administrator"

  value = "AdminUser"
}