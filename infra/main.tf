terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ── Data ─────────────────────────────────────────────────────────────────────

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_route53_zone" "main" {
  name         = "${var.domain_name}."
  private_zone = false
}

# ── Locals ────────────────────────────────────────────────────────────────────

locals {
  api_fqdn = "${var.api_subdomain}.${var.domain_name}"
  azs      = slice(data.aws_availability_zones.available.names, 0, 2)
}
