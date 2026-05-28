output "api_url" {
  description = "Public HTTPS endpoint for the API"
  value       = "https://${local.api_fqdn}"
}

output "ecr_repository_url" {
  description = "ECR repo URL for docker push"
  value       = aws_ecr_repository.app.repository_url
}

output "alb_dns_name" {
  description = "ALB DNS name (use api_url instead)"
  value       = aws_lb.main.dns_name
}
