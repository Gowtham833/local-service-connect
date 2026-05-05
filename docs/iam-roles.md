# ServiConnect — IAM Roles Reference

## IAM Roles Created by Terraform

### 1. `serviconnect-dev-ecs-execution-role`
**Used by:** ECS to pull Docker images from ECR and read secrets at container startup
**Permissions:**
- `AmazonECSTaskExecutionRolePolicy` (managed — ECR pull, CloudWatch logs)
- `secretsmanager:GetSecretValue` on `serviconnect/*` secrets
- `ssm:GetParameter` on `/serviconnect/*` parameters

### 2. `serviconnect-dev-ecs-task-role`
**Used by:** The running Node.js application inside ECS
**Permissions:**
- `bedrock:InvokeModel` — call Claude models
- `comprehend:DetectSentiment` — analyze review sentiment
- `ses:SendEmail` — send notification emails
- `secretsmanager:GetSecretValue` — read secrets at runtime
- `ssm:GetParameter` — read config parameters
- `logs:PutLogEvents` — write to CloudWatch

### 3. `github-actions-serviconnect-deploy` (Manual — see Step 26 in DEPLOYMENT_GUIDE.md)
**Used by:** GitHub Actions CI/CD pipeline
**Trust:** GitHub OIDC (no static access keys stored in GitHub)
**Permissions:** Sufficient to push to ECR, update ECS service, sync S3, invalidate CloudFront

## Principle of Least Privilege

Each role has ONLY the permissions it needs:
- ECS execution role: CANNOT call Bedrock (only startup tasks)
- ECS task role: CANNOT push ECR images (only runtime tasks)
- GitHub Actions role: CANNOT create new IAM roles

## Security Groups

| Group | Allows | From |
|-------|--------|------|
| ALB SG | 80, 443 inbound | 0.0.0.0/0 (internet) |
| ECS SG | 5000 inbound | ALB SG only |
| RDS SG | 5432 inbound | ECS SG only |

The RDS database is **never directly accessible from the internet**.
