variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "serviconnect"
}

variable "environment" {
  description = "Deployment environment (dev or prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be 'dev' or 'prod'."
  }
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "serviconnect"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "serviconnect_admin"
}

variable "ecs_cpu" {
  description = "ECS task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "ecs_memory" {
  description = "ECS task memory (MB)"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Number of ECS task instances"
  type        = number
  default     = 1
}

variable "backend_image_tag" {
  description = "Docker image tag to deploy (e.g. 'latest' or commit SHA)"
  type        = string
  default     = "latest"
}

variable "domain_name" {
  description = "Custom domain name (optional)"
  type        = string
  default     = ""
}

variable "bedrock_model_id" {
  description = "AWS Bedrock model ID for AI features"
  type        = string
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}

variable "ses_from_email" {
  description = "Verified SES sender email address"
  type        = string
  default     = ""
}

variable "alert_email" {
  description = "Email for CloudWatch alarm notifications"
  type        = string
  default     = ""
}
