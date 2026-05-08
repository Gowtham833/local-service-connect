# ── Dev Environment ───────────────────────────────────────────
project_name       = "serviconnect"
environment        = "dev"
aws_region         = "us-east-1"
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
db_instance_class  = "db.t3.micro"
db_name            = "serviconnect"
db_username        = "serviconnect_admin"
ecs_cpu            = 256
ecs_memory         = 512
ecs_desired_count  = 1
backend_image_tag  = "latest"
bedrock_model_id   = "anthropic.claude-3-haiku-20240307-v1:0"
alert_email        = ""
