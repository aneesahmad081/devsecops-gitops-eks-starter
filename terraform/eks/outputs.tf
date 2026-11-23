
output "vpc_id" {
  description = "Created VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "cluster_name" {
  description = "Amazon EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Amazon EKS Kubernetes API endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_version" {
  description = "Kubernetes version"
  value       = module.eks.cluster_version
}
