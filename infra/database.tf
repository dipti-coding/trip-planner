# ── RDS subnet group (uses private subnets) ───────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${var.app_name}-db-subnet-group" }
}

# ── RDS PostgreSQL 16 ─────────────────────────────────────────────────────────

resource "aws_db_instance" "postgres" {
  identifier        = "${var.app_name}-postgres"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t4g.micro"
  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible     = false
  multi_az                = false
  skip_final_snapshot     = false
  backup_retention_period = 7
  deletion_protection     = true

  tags = { Name = "${var.app_name}-postgres" }
}

# ── Secrets Manager: DB credentials ──────────────────────────────────────────
# Values are NOT managed by Terraform — run `just push-secrets` after apply
# to populate them from .env.

resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.app_name}/db-password"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "database_url" {
  name                    = "${var.app_name}/database-url"
  recovery_window_in_days = 0
}
