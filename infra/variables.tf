variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "db_username" {
  description = "Aurora master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Aurora master password"
  type        = string
  sensitive   = true
}
