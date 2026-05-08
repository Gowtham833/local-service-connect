# ── Prod Environment ──────────────────────────────────────────
project_name       = "serviconnect"
environment        = "prod"
aws_region         = "us-east-1"
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
db_instance_class  = "db.t3.small"
db_name            = "serviconnect"
db_username        = "serviconnect_admin"
ecs_cpu            = 512
ecs_memory         = 1024
ecs_desired_count  = 2
backend_image_tag  = "latest"
bedrock_model_id   = "anthropic.claude-3-sonnet-20240229-v1:0"
alert_email        = "team@serviconnect.in"
