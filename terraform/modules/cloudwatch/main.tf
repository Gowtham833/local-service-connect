variable "name_prefix"      { type = string }
variable "alert_email"      { type = string }
variable "ecs_cluster_name" { type = string }
variable "ecs_service_name" { type = string }
variable "alb_arn_suffix"   { type = string }

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.name_prefix}/backend"
  retention_in_days = 30
  tags              = { Name = "${var.name_prefix}-logs" }
}

resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.name_prefix}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU > 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions          = { ClusterName = var.ecs_cluster_name, ServiceName = var.ecs_service_name }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.name_prefix}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB 5xx errors > 10 in 5 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions          = { LoadBalancer = var.alb_arn_suffix }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"
  dashboard_body = jsonencode({
    widgets = [
      { type = "metric", properties = { title = "ECS CPU", metrics = [["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name]], period = 300, stat = "Average" } },
      { type = "metric", properties = { title = "ECS Memory", metrics = [["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name]], period = 300, stat = "Average" } },
      { type = "metric", properties = { title = "ALB Request Count", metrics = [["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix]], period = 300, stat = "Sum" } },
    ]
  })
}

output "log_group_name" { value = aws_cloudwatch_log_group.backend.name }
output "sns_topic_arn"  { value = aws_sns_topic.alerts.arn }
