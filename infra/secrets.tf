# ── JWT secrets (set manually after first apply) ─────────────────────────────

resource "aws_secretsmanager_secret" "jwt_secret_key" {
  name                    = "${var.app_name}/jwt-secret-key"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "auth_user_email" {
  name                    = "${var.app_name}/auth-user-email"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "auth_user_password_hash" {
  name                    = "${var.app_name}/auth-user-password-hash"
  recovery_window_in_days = 0
}
