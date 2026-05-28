variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-west-2"
}

variable "app_name" {
  description = "Name prefix used across all resources"
  type        = string
  default     = "trip-planner"
}

variable "domain_name" {
  description = "Root domain of the Route 53 hosted zone"
  type        = string
  default     = "ankit.link"
}

variable "api_subdomain" {
  description = "Subdomain for the API"
  type        = string
  default     = "api"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "trip_planner"
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "trip_planner"
}

variable "ecr_image_tag" {
  description = "Docker image tag to deploy (set by CI or deploy script)"
  type        = string
  default     = "latest"
}

variable "fargate_cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "fargate_memory" {
  description = "Fargate task memory in MB"
  type        = number
  default     = 512
}
