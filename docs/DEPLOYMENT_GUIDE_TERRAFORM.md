# ServiConnect — Terraform Deployment Guide
# Fast, Automated Infrastructure as Code Deployment

This guide explains how to deploy the entire ServiConnect AWS architecture automatically using Terraform.

---

## PHASE 1: PREREQUISITES

### 1. Install Required Tools
- **AWS CLI**: Download from https://aws.amazon.com/cli/
- **Terraform**: Download from https://developer.hashicorp.com/terraform/downloads
- **Docker Desktop**: Download from https://www.docker.com/products/docker-desktop/

### 2. Configure AWS CLI
Open your terminal (PowerShell/Command Prompt) and run:
```bash
aws configure
```
Enter your AWS Access Key ID, Secret Access Key, region (`us-east-1`), and output format (`json`).

### 3. Enable AWS Bedrock Models
1. Open the AWS Console → go to **Amazon Bedrock**.
2. Left menu → **Model access**.
3. Click **Modify model access**.
4. Check ✅ **Anthropic Claude 3 Haiku** and ✅ **Anthropic Claude 3 Sonnet**.
5. Click **Submit** (Wait 2 mins for access to be granted).

---

## PHASE 2: TERRAFORM STATE SETUP (One-Time)

Terraform needs an S3 bucket and DynamoDB table to store its state file securely.

1. Open AWS Console → **S3** → **Create bucket**.
   - Name: `serviconnect-terraform-state` (Must match provider.tf exactly)
   - Region: `us-east-1`
   - Enable Bucket Versioning.
   - Create bucket.
2. Open AWS Console → **DynamoDB** → **Create table**.
   - Name: `serviconnect-terraform-locks`
   - Partition key: `LockID` (String)
   - Create table.

---

## PHASE 3: DEPLOY INFRASTRUCTURE

### 1. Initialize Terraform
Open your terminal, navigate to the terraform directory, and run:
```bash
cd terraform
terraform init
```

### 2. Plan the Deployment
Review all the resources that will be created:
```bash
terraform plan -var-file=environments/dev/terraform.tfvars
```

### 3. Apply the Deployment
Create the infrastructure (this takes about 10-15 minutes):
```bash
terraform apply -var-file=environments/dev/terraform.tfvars
```
Type `yes` when prompted.

**Save the Outputs!**
When it finishes, copy the outputs printed to the terminal (e.g., `alb_dns_name`, `ecr_repository_url`, `s3_bucket_name`, `cloudfront_url`, `cognito_user_pool_id`, `cognito_client_id`).

---

## PHASE 4: PUSH BACKEND CODE (DOCKER)

### 1. Login to ECR
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

### 2. Build and Push
```bash
# Return to root directory
cd ..

# Build image
docker build -t <ECR_REPOSITORY_URL>:latest ./backend

# Push image
docker push <ECR_REPOSITORY_URL>:latest
```

---

## PHASE 5: DATABASE MIGRATION

1. Go to AWS Console → **Secrets Manager** → click `serviconnect-dev/db-credentials`.
2. Click **Retrieve secret value** and copy the `password`.
3. Set up your local `.env` inside the `backend` folder:
```env
DB_HOST=<rds_endpoint_from_terraform_outputs>
DB_PORT=5432
DB_NAME=serviconnect
DB_USER=serviconnect_admin
DB_PASS=<password_from_secrets_manager>
NODE_ENV=production
```
4. Run the migrations:
```bash
cd backend
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

---

## PHASE 6: DEPLOY FRONTEND

1. Update `frontend/public/js/config.js` with your Terraform outputs:
```javascript
window.__SERVICONNECT_CONFIG__ = {
  API_BASE_URL: 'http://<alb_dns_name>',
  COGNITO_USER_POOL_ID: '<cognito_user_pool_id>',
  COGNITO_CLIENT_ID: '<cognito_client_id>',
  AWS_REGION: 'us-east-1'
};
```

2. Upload to S3:
```bash
aws s3 sync ../frontend/public/ s3://<s3_bucket_name>/ --delete
```

3. Invalidate CloudFront Cache:
```bash
aws cloudfront create-invalidation --distribution-id <cloudfront_id> --paths "/*"
```

**Done!** Visit your `cloudfront_url` to see the live application.
