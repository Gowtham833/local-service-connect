variable "name_prefix"            { type = string }
variable "aws_region"             { type = string }
variable "vpc_id"                 { type = string }
variable "private_subnet_ids"     { type = list(string) }
variable "alb_target_group_arn"   { type = string }
variable "alb_security_group_id"  { type = string }
variable "ecs_task_role_arn"      { type = string }
variable "ecs_execution_role_arn" { type = string }
variable "ecr_repository_url"     { type = string }
variable "backend_image_tag"      { type = string }
variable "ecs_cpu"                { type = number }
variable "ecs_memory"             { type = number }
variable "ecs_desired_count"      { type = number }
variable "db_secret_arn"          { type = string }
variable "app_secret_arn"         { type = string }
variable "ssm_prefix"             { type = string }
variable "app_name"               { type = string }
variable "cloudwatch_log_group"   { type = string }

resource "aws_security_group" "ecs" {
  name        = "${var.name_prefix}-ecs-sg"
  description = "ECS tasks security group"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow traffic from ALB only"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name_prefix}-ecs-sg" }
}

resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"
  setting { name = "containerInsights" value = "enabled" }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.name_prefix}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_cpu
  memory                   = var.ecs_memory
  task_role_arn            = var.ecs_task_role_arn
  execution_role_arn       = var.ecs_execution_role_arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "${var.ecr_repository_url}:${var.backend_image_tag}"
    essential = true
    portMappings = [{ containerPort = 5000, protocol = "tcp" }]

    environment = [
      { name = "NODE_ENV",  value = "production" },
      { name = "PORT",      value = "5000" },
      { name = "APP_NAME",  value = var.app_name },
      { name = "AWS_REGION", value = var.aws_region },
    ]

    secrets = [
      { name = "JWT_SECRET", valueFrom = "${var.app_secret_arn}:jwt_secret::" },
      { name = "DB_PASS",    valueFrom = "${var.db_secret_arn}:password::" },
      { name = "DB_USER",    valueFrom = "${var.db_secret_arn}:username::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = var.cloudwatch_log_group
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "backend"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost:5000/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

resource "aws_ecs_service" "backend" {
  name            = "${var.name_prefix}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "backend"
    container_port   = 5000
  }

  deployment_circuit_breaker { enable = true, rollback = true }
  deployment_controller      { type = "ECS" }

  lifecycle { ignore_changes = [task_definition, desired_count] }
}

output "ecs_cluster_name"      { value = aws_ecs_cluster.main.name }
output "ecs_service_name"      { value = aws_ecs_service.backend.name }
output "ecs_security_group_id" { value = aws_security_group.ecs.id }
