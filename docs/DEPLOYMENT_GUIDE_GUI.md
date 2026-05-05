# ServiConnect — Manual AWS Console (GUI) Deployment Guide
# Click-by-Click Guide for Complete Beginners

This guide walks you through deploying the entire ServiConnect architecture manually using ONLY the AWS Management Console (no CLI, no Terraform).

---

## PHASE 1: INITIAL SETUP

### 1. Enable AI Models (Bedrock)
1. In the AWS Console search bar, type **Bedrock** and open it.
2. In the left menu, scroll down to **Model access**.
3. Click the orange **Modify model access** button.
4. Check the boxes for **Anthropic Claude 3 Haiku** and **Anthropic Claude 3 Sonnet**.
5. Click **Submit**. Wait a few minutes until the status says "Access granted".

### 2. Generate Secrets (Secrets Manager)
We need a database password and a JWT secret for the app.
1. Go to **Secrets Manager** → **Store a new secret**.
2. Secret type: **Other type of secret**.
3. Key/Value pairs:
   - Key: `password`, Value: `YourStrongDBPassword123!`
   - Key: `username`, Value: `serviconnect_admin`
   - Key: `dbname`, Value: `serviconnect`
4. Click Next. Name the secret: `serviconnect-dev/db-credentials`. Click Next -> Store.
5. Create another secret (Other type).
   - Key: `jwt_secret`, Value: `a_very_long_random_string_for_jwt`
6. Name it: `serviconnect-dev/app-secrets`. Store it.

---

## PHASE 2: NETWORKING (VPC)

### 1. Create a VPC
1. Go to **VPC** → **Your VPCs** → **Create VPC**.
2. Select **VPC and more** (this is a wizard that creates everything for you).
3. Name tag auto-generation: `serviconnect-dev`
4. IPv4 CIDR block: `10.0.0.0/16`
5. Number of Availability Zones (AZs): **2**
6. Number of public subnets: **2**
7. Number of private subnets: **2**
8. NAT gateways ($): **In 1 AZ** (Required for private subnets to reach the internet).
9. VPC endpoints: **None**.
10. Click **Create VPC**. Wait for it to finish.

### 2. Create Security Groups
1. Go to **EC2** → **Security Groups** (left menu) → **Create security group**.
2. **ALB Security Group**:
   - Name: `serviconnect-alb-sg`
   - VPC: Select your new `serviconnect-dev-vpc`.
   - Inbound Rules: Add **HTTP** (Port 80) from **Anywhere-IPv4**. Add **HTTPS** (Port 443) from **Anywhere-IPv4**.
   - Create.
3. **ECS Security Group**:
   - Name: `serviconnect-ecs-sg`
   - VPC: `serviconnect-dev-vpc`.
   - Inbound Rules: Custom TCP, Port `5000`, Source: Select `serviconnect-alb-sg`.
   - Create.
4. **RDS Security Group**:
   - Name: `serviconnect-rds-sg`
   - VPC: `serviconnect-dev-vpc`.
   - Inbound Rules: PostgreSQL (Port 5432), Source: Select `serviconnect-ecs-sg`.
   - Create.

---

## PHASE 3: DATABASE (RDS)

1. Go to **RDS** → **Databases** → **Create database**.
2. Choose **Standard create**. Engine: **PostgreSQL**. Version: **15.4**.
3. Templates: **Free tier** (or Dev/Test).
4. DB instance identifier: `serviconnect-postgres`.
5. Master username: `serviconnect_admin`.
6. Master password: Use the password you created in Secrets Manager (`YourStrongDBPassword123!`).
7. Instance configuration: `db.t3.micro`.
8. Connectivity:
   - VPC: `serviconnect-dev-vpc`.
   - Public access: **No**.
   - VPC security group: Choose **Existing**, select `serviconnect-rds-sg` (remove the default one).
9. Additional configuration: Initial database name: `serviconnect`.
10. Click **Create database**. (This takes 10 mins).

---

## PHASE 4: AUTHENTICATION (COGNITO)

1. Go to **Cognito** → **User pools** → **Create user pool**.
2. Sign-in options: Check **Phone number**. Click Next.
3. Password policy: Cognito defaults (8 chars, numbers, uppercase).
4. Multi-factor authentication: **No MFA**.
5. User account recovery: **Email only**. Click Next.
6. Required attributes: leave blank. Click Next.
7. Email provider: Send email with Cognito.
8. User pool name: `serviconnect-users`.
9. Initial app client name: `serviconnect-app-client`.
10. Click **Create user pool**.
11. Note down the **User Pool ID** and **Client ID**.

---

## PHASE 5: CONTAINER REGISTRY (ECR)

1. Go to **Elastic Container Registry (ECR)** → **Create repository**.
2. Visibility: **Private**.
3. Name: `serviconnect-backend`.
4. Click **Create**.
5. Click on your new repo, then click **View push commands**. Follow the instructions provided there to build and push your Docker image from your local computer using the CLI (this is the only CLI step required).

---

## PHASE 6: COMPUTE (ECS FARGATE)

### 1. Create IAM Roles for ECS
1. Go to **IAM** → **Roles** → **Create role**.
2. Trusted entity: AWS service → **Elastic Container Service Task**.
3. Create the **Task Execution Role** (`serviconnect-execution-role`):
   - Attach policy: `AmazonECSTaskExecutionRolePolicy`.
   - Add inline policy to allow reading from Secrets Manager (`secretsmanager:GetSecretValue`).
4. Create the **Task Role** (`serviconnect-task-role`):
   - Add inline policy allowing Bedrock (`bedrock:InvokeModel`), Comprehend (`comprehend:DetectSentiment`), and Secrets Manager access.

### 2. Create ECS Cluster
1. Go to **ECS** → **Clusters** → **Create cluster**.
2. Name: `serviconnect-cluster`. Infrastructure: AWS Fargate. Create.

### 3. Create Task Definition
1. Go to **Task definitions** → **Create new task definition**.
2. Name: `serviconnect-backend-task`.
3. Launch type: AWS Fargate. OS: Linux.
4. CPU: 0.25 vCPU. Memory: 0.5 GB.
5. Task role: `serviconnect-task-role`. Execution role: `serviconnect-execution-role`.
6. Container details:
   - Name: `backend`
   - Image URI: `<your-account-id>.dkr.ecr.us-east-1.amazonaws.com/serviconnect-backend:latest`
   - Container port: 5000 (TCP).
7. Environment variables: Add `NODE_ENV=production`, `PORT=5000`, `AWS_REGION=us-east-1`.
8. Click **Create**.

---

## PHASE 7: LOAD BALANCER (ALB)

1. Go to **EC2** → **Target Groups** (left menu) → **Create target group**.
2. Type: **IP addresses**. Name: `serviconnect-tg`. Protocol: HTTP. Port: 5000.
3. VPC: `serviconnect-dev-vpc`. Health check path: `/api/health`. Create.
4. Go to **Load Balancers** → **Create Load Balancer**.
5. Type: **Application Load Balancer**. Name: `serviconnect-alb`.
6. Scheme: Internet-facing.
7. Network mapping: Select `serviconnect-dev-vpc`. Check BOTH public subnets.
8. Security groups: `serviconnect-alb-sg`.
9. Listeners: HTTP 80 → Forward to `serviconnect-tg`.
10. Click **Create load balancer**. Note down the **DNS name** (e.g., `serviconnect-alb-xxxx.us-east-1.elb.amazonaws.com`).

---

## PHASE 8: RUN ECS SERVICE

1. Go back to **ECS** → Clusters → `serviconnect-cluster`.
2. Under Services tab, click **Create**.
3. Compute options: Launch type (Fargate).
4. Task definition: Select `serviconnect-backend-task`.
5. Service name: `serviconnect-service`. Desired tasks: 1.
6. Networking: Select `serviconnect-dev-vpc`. Select your TWO PRIVATE subnets.
7. Security group: Select `serviconnect-ecs-sg`.
8. Public IP: Turn OFF.
9. Load balancing: Application Load Balancer. Select `serviconnect-alb`. Container: `backend:5000`. Target group: `serviconnect-tg`.
10. Click **Create**. Wait until the task is "RUNNING".

---

## PHASE 9: FRONTEND (S3 & CLOUDFRONT)

### 1. Create S3 Bucket
1. Go to **S3** → **Create bucket**.
2. Name: `serviconnect-frontend-unique123` (must be globally unique).
3. Block all public access: Leave CHECKED (CloudFront will access it securely).
4. Create.

### 2. Update config.js
On your local computer, edit `frontend/public/js/config.js`:
```javascript
window.__SERVICONNECT_CONFIG__ = {
  API_BASE_URL: 'http://<ALB-DNS-NAME>',
  COGNITO_USER_POOL_ID: '<Cognito-Pool-ID>',
  COGNITO_CLIENT_ID: '<Cognito-Client-ID>',
  AWS_REGION: 'us-east-1'
};
```

### 3. Upload Files
1. In the S3 Console, click your bucket → **Upload**.
2. Drag and drop everything inside the `frontend/public/` folder into the bucket. Click Upload.

### 4. Create CloudFront Distribution
1. Go to **CloudFront** → **Create distribution**.
2. Origin domain: Select your S3 bucket from the dropdown.
3. Origin access: Select **Origin access control settings (recommended)**. Click **Create control setting** and save.
4. Viewer protocol policy: **Redirect HTTP to HTTPS**.
5. Default root object: `index.html`.
6. Web Application Firewall (WAF): Enable security protections.
7. Click **Create distribution**.
8. **CRITICAL**: CloudFront will prompt you with a yellow banner saying "The S3 bucket policy needs to be updated". Click the **Copy policy** button, go to your S3 Bucket → Permissions → Bucket Policy, paste it, and save.
9. Note down your CloudFront **Distribution domain name** (e.g., `d12345abcdef.cloudfront.net`).

---

## PHASE 10: VERIFICATION

1. Open your browser.
2. Go to your CloudFront URL: `https://d12345abcdef.cloudfront.net`
3. You should see the ServiConnect landing page!
4. The frontend will communicate with your Application Load Balancer, which routes to ECS, which connects to RDS and AWS Bedrock.

**Congratulations! You have manually deployed a cloud-native AWS architecture using the console GUI!**
