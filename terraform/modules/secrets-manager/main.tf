variable "name_prefix" { type = string }
variable "db_username" { type = string }
variable "db_name"     { type = string }

# ── DB Credentials Secret ─────────────────────────────────────
resource "aws_secretsmanager_secret" "db" {
  name        = "${var.name_prefix}/db-credentials"
  description = "RDS PostgreSQL credentials"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db.result
    dbname   = var.db_name
  })
}

resource "random_password" "db" {
  length           = 24
  special          = true
  override_special = "!#$%^&*"
}

# ── App Secrets (JWT, etc.) ───────────────────────────────────
resource "aws_secretsmanager_secret" "app" {
  name        = "${var.name_prefix}/app-secrets"
  description = "Application secrets (JWT, etc.)"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    jwt_secret = random_password.jwt.result
    jwt_expire = "7d"
  })
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

output "db_secret_arn"  { value = aws_secretsmanager_secret.db.arn }
output "app_secret_arn" { value = aws_secretsmanager_secret.app.arn }
