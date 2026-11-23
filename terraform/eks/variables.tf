
variable "aws_region" {
  description = "AWS Region for the EKS infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "Name of the Amazon EKS cluster"
  type        = string
  default     = "devsecops-eks-cluster"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "admin_cidr" {
  description = "Public IP CIDR allowed to access the EKS Kubernetes API"
  type        = string

  validation {
    condition     = can(cidrhost(var.admin_cidr, 0))
    error_message = "Provide a valid IPv4 CIDR such as 203.0.113.10/32."
  }
}
