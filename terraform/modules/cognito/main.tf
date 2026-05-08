variable "name_prefix" { type = string }

resource "aws_cognito_user_pool" "main" {
  name = "${var.name_prefix}-users"

  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
  }

  username_attributes = ["phone_number"]

  auto_verified_attributes = ["phone_number"]

  schema {
    attribute_data_type = "String"
    name                = "role"
    mutable             = true
    string_attribute_constraints { min_length = "1", max_length = "20" }
  }

  account_recovery_setting {
    recovery_mechanism { name = "verified_phone_number", priority = 1 }
  }

  tags = { Name = "${var.name_prefix}-cognito" }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.name_prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

output "user_pool_id" { value = aws_cognito_user_pool.main.id }
output "client_id"    { value = aws_cognito_user_pool_client.main.id }
