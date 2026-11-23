
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "6.8.0"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs = [
    "${var.aws_region}a",
    "${var.aws_region}b"
  ]

  public_subnets = [
    "10.20.1.0/24",
    "10.20.2.0/24"
  ]

  private_subnets = [
    "10.20.11.0/24",
    "10.20.12.0/24"
  ]

  enable_dns_hostnames = true
  enable_dns_support   = true

  enable_nat_gateway = true
  single_nat_gateway = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "21.30.2"

  name               = var.cluster_name
  kubernetes_version = "1.37"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  endpoint_private_access      = true
  endpoint_public_access       = true
  endpoint_public_access_cidrs = [var.admin_cidr]

  enable_cluster_creator_admin_permissions = true



  # Lab cost optimization
  create_kms_key              = false
  encryption_config           = null
  create_cloudwatch_log_group = false
  enabled_log_types           = []


  addons = {
    coredns    = {}
    kube-proxy = {}

    vpc-cni = {
      before_compute = true
    }
  }


  eks_managed_node_groups = {
    general = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["m7i-flex.large"]
      capacity_type  = "ON_DEMAND"

      min_size     = 1
      max_size     = 2
      desired_size = 1

      disk_size = 30
    }
  }
}