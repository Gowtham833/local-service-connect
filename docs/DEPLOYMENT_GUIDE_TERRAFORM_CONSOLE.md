# ServiConnect — Terraform Console (Cloud9) Deployment Guide
# 100% Browser-Based Deployment (No Local Installation Required!)

Since you are a beginner, this guide is designed to be the absolute easiest way to deploy ServiConnect. 
Instead of installing complicated tools (like Docker, Node.js, Terraform, or AWS CLI) on your own computer, we will use **AWS Cloud9**. 

AWS Cloud9 gives you a fully functional code editor and terminal directly inside your web browser. Everything happens inside AWS!

---

## PHASE 1: ENABLE AI MODELS
1. Log into the AWS Management Console.
2. In the top search bar, type **Bedrock** and click on **Amazon Bedrock**.
3. In the left menu, scroll down to **Model access**.
4. Click the orange **Modify model access** button at the top right.
5. Check the boxes for ✅ **Anthropic Claude 3 Haiku** and ✅ **Anthropic Claude 3 Sonnet**.
6. Click **Submit**. (Wait about 2 minutes for the status to change to "Access granted").

---

## PHASE 2: CREATE YOUR CLOUD BROWSER (AWS CLOUD9)

1. In the AWS search bar at the top, type **Cloud9** and click it.
2. Click the orange **Create environment** button.
3. **Name**: `ServiConnect-Workspace`
4. **Instance type**: Select **t3.small** (2 GiB RAM). *(This is important because Docker needs a little bit of memory to build the backend).*
5. **Platform**: Amazon Linux 2023.
6. **Network settings**: Leave as default (AWS Systems Manager).
7. Click **Create**.
8. Wait 1-2 minutes, then click **Open** under the Cloud9 IDE column. 
   *(A new browser tab will open showing a dark-themed code editor with a terminal at the bottom).*

---

## PHASE 3: SETUP TERRAFORM (Inside Cloud9)

In the terminal at the bottom of your Cloud9 screen, copy and paste these commands one by one, pressing Enter after each:

**1. Install Terraform:**
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo
sudo yum -y install terraform
```

**2. Download the ServiConnect Code:**
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/serviconnect.git
cd serviconnect
```

**3. Create the Terraform State Storage:**
Terraform needs an S3 bucket and DynamoDB table to remember what it built. Run these two commands:
```bash
aws s3api create-bucket --bucket serviconnect-terraform-state --region us-east-1
aws dynamodb create-table --table-name serviconnect-terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region us-east-1
```

---

## PHASE 4: DEPLOY THE INFRASTRUCTURE

Still inside the Cloud9 terminal, run:

```bash
cd terraform
terraform init
terraform apply -var-file=environments/dev/terraform.tfvars
```
- It will show you a massive list of things it's going to build.
- It will ask: `Do you want to perform these actions?`
- Type **`yes`** and press Enter.
- *Wait about 10-15 minutes for it to finish creating the VPC, Database, Load Balancer, etc.*

**⚠️ IMPORTANT: SAVE YOUR OUTPUTS!**
When it finishes, you will see a list of green text outputs. Copy these to a notepad on your computer. You need them for the next steps!
- `alb_dns_name`
- `cloudfront_id`
- `cloudfront_url`
- `cognito_client_id`
- `cognito_user_pool_id`
- `ecr_repository_url`
- `rds_endpoint`
- `s3_bucket_name`

---

## PHASE 5: BUILD AND PUSH THE BACKEND (DOCKER)

Because you are using Cloud9, Docker is already installed for you! Run these commands in the terminal:

```bash
# Go back to the main folder
cd ~/environment/serviconnect

# Login to the AWS Container Registry (ECR)
# Note: Replace <YOUR_ACCOUNT_ID> with your actual 12 digit AWS Account ID!
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build the Docker Image (Replace the URL with your ecr_repository_url output)
docker build -t <YOUR_ECR_REPOSITORY_URL>:latest ./backend

# Upload the Docker Image to AWS
docker push <YOUR_ECR_REPOSITORY_URL>:latest
```

---

## PHASE 6: DATABASE SETUP

Now we need to create the database tables. Node.js is also already installed in Cloud9!

1. In the left-hand file tree of Cloud9, open the `backend` folder.
2. Right-click the `backend` folder → **New File**. Name it `.env`.
3. Double-click `.env` to open it in the editor, and paste this in:
```env
DB_HOST=<paste_your_rds_endpoint_here>
DB_PORT=5432
DB_NAME=serviconnect
DB_USER=serviconnect_admin
DB_PASS=<paste_password_from_secrets_manager>
NODE_ENV=production
```
*(To get the password, open a new AWS tab, search for "Secrets Manager", click "serviconnect-dev/db-credentials", and click "Retrieve secret value").*
Save the file (Ctrl+S or Cmd+S).

4. Run the database migrations in the terminal:
```bash
cd backend
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

---

## PHASE 7: DEPLOY THE FRONTEND

1. In the Cloud9 file tree on the left, navigate to `frontend/public/js/` and double-click `config.js`.
2. Update the file with your Terraform outputs:
```javascript
window.__SERVICONNECT_CONFIG__ = {
  API_BASE_URL: 'http://<alb_dns_name>',
  COGNITO_USER_POOL_ID: '<cognito_user_pool_id>',
  COGNITO_CLIENT_ID: '<cognito_client_id>',
  AWS_REGION: 'us-east-1'
};
```
3. Save the file (Ctrl+S or Cmd+S).

4. Upload the files to S3 using the terminal:
```bash
cd ~/environment/serviconnect
aws s3 sync ./frontend/public/ s3://<paste_your_s3_bucket_name_here>/ --delete
```

5. Tell CloudFront to refresh the cache:
```bash
aws cloudfront create-invalidation --distribution-id <paste_your_cloudfront_id_here> --paths "/*"
```

---

## 🎉 YOU ARE DONE!
Open your browser and visit your `cloudfront_url` (e.g., `https://d12345abcdef.cloudfront.net`). Your ServiConnect platform is now live!
