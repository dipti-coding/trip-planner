terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Aurora PostgreSQL cluster — provisioned in Week 4
# resource "aws_rds_cluster" "trip_planner" {
#   cluster_identifier      = "trip-planner"
#   engine                  = "aurora-postgresql"
#   engine_version          = "16.2"
#   master_username         = var.db_username
#   master_password         = var.db_password
#   skip_final_snapshot     = false
#   final_snapshot_identifier = "trip-planner-final"
# }
