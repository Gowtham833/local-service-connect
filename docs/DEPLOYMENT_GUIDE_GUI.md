# ServiConnect — One-Click GUI Deployment Guide

This guide is designed for beginners. You will deploy the entire ServiConnect platform automatically using the AWS Management Console by uploading a single "Monolithic" CloudFormation template.

Unlike the complex CLI deployments, this requires **zero coding** and **zero terminal commands** to get the infrastructure running!

---

## Prerequisites

1. An **AWS Account** with administrative access.
2. **Docker** installed and running on your local machine (required *only* for building the backend image).

---

## Step 1: Deploy the CloudFormation Template (GUI)

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, search for **CloudFormation** and open it.
3. In the top right corner, click **Create stack** -> **With new resources (standard)**.
4. Under **Prepare template**, select **Template is ready**.
5. Under **Specify template**, select **Upload a template file**.
6. Click **Choose file** and select the `cloudformation/single-click-deploy.yaml` file from this project's folder.
7. Click **Next**.
8. **Specify stack details**:
   - **Stack name**: `serviconnect-dev-stack`
   - Review the parameters. You can leave the defaults for `EcsCpu`, `EcsMemory`, and `VpcCidr`.
   - Choose two distinct **AvailabilityZones** (e.g., `us-east-1a` and `us-east-1b`).
   - *Optional:* Enter an email in `AlertEmail` if you want to receive server error alerts.
9. Click **Next**.
10. **Configure stack options**: Scroll to the bottom and click **Next**.
11. **Review**: Scroll to the absolute bottom of the page.
    - Check the box that says: **"I acknowledge that AWS CloudFormation might create IAM resources with custom names."**
12. Click **Submit**.

> [!NOTE]
> This process will take about 10–15 minutes because it is provisioning an RDS Database and VPC infrastructure.
> **IMPORTANT:** The ECS Service will fail to start initially because we haven't uploaded our backend Docker image yet. That is normal! Proceed to Step 2 while the stack is creating.

---

## Step 2: Push Docker Image to ECR

Once the `BackendRepository` resource shows as `CREATE_COMPLETE` in the CloudFormation events (or after the whole stack finishes), you need to push your Docker image.

1. Open your terminal/command prompt and log in to AWS CLI:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
   ```
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Build the image:
   ```bash
   docker build -t serviconnect-dev-backend .
   ```
4. Tag the image:
   ```bash
   docker tag serviconnect-dev-backend:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/serviconnect-dev-backend:latest
   ```
5. Push the image:
   ```bash
   docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/serviconnect-dev-backend:latest
   ```

*(Once pushed, ECS will automatically detect the image, restart the service, and stabilize).*

---

## Step 3: Deploy the Frontend

1. Go back to your CloudFormation stack in the AWS Console.
2. Click on the **Outputs** tab. Note down the following values:
   - `S3BucketName`
   - `CognitoUserPoolId`
   - `CognitoClientId`
   - `AlbDnsName`
   - `CloudfrontUrl`
3. On your local computer, open `frontend/public/js/config.js` and update it:
   ```javascript
   window.__SERVICONNECT_CONFIG__ = {
     API_BASE_URL: 'http://<AlbDnsName>',
     COGNITO_USER_POOL_ID: '<CognitoUserPoolId>',
     COGNITO_CLIENT_ID: '<CognitoClientId>',
     AWS_REGION: 'us-east-1'
   };
   ```
4. In the AWS Console, search for **S3** and open it.
5. Find your `serviconnect-dev-frontend-us-east-1-...` bucket and click on it.
6. Click **Upload**. Drag and drop all files and folders inside your local `frontend/public/` folder into the bucket. Click **Upload**.

---

## Verification

Get the `CloudfrontUrl` from the CloudFormation Outputs tab (e.g., `d12345abcdef.cloudfront.net`) and open it in your browser. 

You should see the ServiConnect application running! The frontend will communicate with your Application Load Balancer, which securely routes requests to your ECS containers, PostgreSQL database, and AWS Bedrock.

**Congratulations! You have successfully deployed a cloud-native architecture using a GUI.**
