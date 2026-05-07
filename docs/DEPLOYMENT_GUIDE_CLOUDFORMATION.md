# ServiConnect — CloudFormation Deployment Guide

This guide walks you through deploying the ServiConnect architecture using AWS CloudFormation. We are using **Nested Stacks**, which means there is a master template (`master.yaml`) that calls several child templates (VPC, RDS, ECS, etc.).

Because we are using nested templates, you must use the AWS CLI to package and deploy the templates.

## Prerequisites

1. An **AWS Account** with administrative access.
2. **AWS CLI** installed on your local machine ([Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)).
3. AWS CLI configured with your credentials (`aws configure`).
4. **Docker** installed and running on your local machine (required to build the backend image).

---

## Step 1: Create an S3 Bucket for CloudFormation Artifacts

CloudFormation needs an S3 bucket to store the nested templates before deployment.
Run this command to create a bucket (replace `your-unique-bucket-name` with a globally unique name, e.g., `serviconnect-cfn-artifacts-12345`):

```bash
aws s3 mb s3://your-unique-bucket-name --region us-east-1
```

## Step 2: Build and Push Docker Image

Before deploying the CloudFormation stack, the backend Docker image must be built and pushed to ECR. However, because CloudFormation creates the ECR repository, the image cannot be pushed before the deployment starts.

**Solution:**
Deploy the CloudFormation stack as instructed in Step 4. The ECS Service creation will initially fail or remain pending because the image does not exist yet. While the stack is deploying and the ECR repository is created, proceed to Step 5 to push the Docker image. Once the image is pushed, the ECS service will automatically stabilize.

## Step 3: Package the CloudFormation Templates

Navigate to the project root directory in your terminal. Run the `aws cloudformation package` command. This will upload the nested templates to S3 and generate a new `packaged.yaml` file.

```bash
aws cloudformation package \
  --template-file cloudformation/master.yaml \
  --s3-bucket your-unique-bucket-name \
  --output-template-file cloudformation/packaged.yaml
```

## Step 4: Deploy the CloudFormation Stack

Deploy the packaged template using the `aws cloudformation deploy` command. You can pass in a parameter file to configure the environment.

```bash
aws cloudformation deploy \
  --template-file cloudformation/packaged.yaml \
  --stack-name serviconnect-dev-stack \
  --parameter-overrides file://cloudformation/parameters/dev.json \
  --capabilities CAPABILITY_NAMED_IAM
```

This process will take approximately 10-15 minutes to complete because it has to provision an RDS Database and VPC infrastructure.

## Step 5: Push Docker Image to ECR

Once the stack begins creating the ECR repository (or after it finishes), build and push your backend image:

1. Get your AWS Account ID: `aws sts get-caller-identity --query Account --output text`
2. Authenticate Docker to ECR:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
   ```
3. Build the image:
   ```bash
   cd backend
   docker build -t serviconnect-dev-backend .
   ```
4. Tag the image:
   ```bash
   docker tag serviconnect-dev-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/serviconnect-dev-backend:latest
   ```
5. Push the image:
   ```bash
   docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/serviconnect-dev-backend:latest
   ```

*(If your ECS service failed to stabilize during Step 4 because the image was missing, it will automatically restart and pull the image once you push it).*

## Step 6: Deploy the Frontend

1. The CloudFormation stack output will give you the **S3BucketName** and **Cognito IDs**. Check the outputs:
   ```bash
   aws cloudformation describe-stacks --stack-name serviconnect-dev-stack --query "Stacks[0].Outputs"
   ```
2. Open `frontend/public/js/config.js` and update the configuration with the values from the CloudFormation outputs.
3. Upload the frontend files to the S3 bucket:
   ```bash
   aws s3 sync frontend/public/ s3://<Your-S3BucketName-From-Outputs>
   ```

## Verification

Get the `CloudfrontUrl` from the CloudFormation outputs and open it in your browser. You should see the ServiConnect application running successfully!
