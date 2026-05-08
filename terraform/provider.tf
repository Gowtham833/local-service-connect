terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state stored in S3 (bucket created manually before first apply)
  backend "s3" {
    bucket         = "serviconnect-terraform-state"
    key            = "serviconnect/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "serviconnect-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Team        = "ServiConnect"
    }
  }
}

# Secondary provider for Bedrock (always us-east-1 for Claude support)
provider "aws" {
  alias  = "bedrock"
  region = "us-east-1"
}
