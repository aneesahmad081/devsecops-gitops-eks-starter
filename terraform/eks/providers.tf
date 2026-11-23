
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "devsecops-gitops-eks-starter"
      Environment = "lab"
      ManagedBy   = "Terraform"
    }
  }
}
