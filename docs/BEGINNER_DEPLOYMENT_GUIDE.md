# ServiConnect — Ultimate Beginner Deployment Guide

This guide is designed for absolute beginners. You will deploy the entire ServiConnect platform using a mix of the AWS Management Console (GUI) and a few simple copy-paste terminal commands. 

Since you are on Windows, this guide includes the exact steps to set up your computer before we start.

---

## Phase 1: Local Computer Setup (One-Time)

Since your application uses a "Docker Container" for the backend, we need two tools installed on your computer.

### 1. Install AWS CLI
The AWS Command Line Interface allows your computer to securely talk to your AWS account.
1. Download the Windows installer here: [AWS CLI for Windows](https://awscli.amazonaws.com/AWSCLIV2.msi)
2. Run the downloaded `.msi` file and click "Next" through the standard installation.

### 2. Install Docker Desktop
Docker is used to package your backend code into a standardized container.
1. Download Docker Desktop here: [Docker Desktop for Windows](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe)
2. Run the installer (leave the default settings checked, especially WSL 2).
3. **Restart your computer** if prompted.
4. After restarting, open the "Docker Desktop" application from your Start Menu and leave it running in the background.

### 3. Connect your AWS CLI to your Account
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Click on your account name in the top right corner and select **Security credentials**.
3. Scroll down to **Access keys** and click **Create access key**.
4. Select **Command Line Interface (CLI)**, check the confirmation box, and click **Next** -> **Create access key**.
5. Keep this page open (you will need the Access Key ID and Secret Access Key).
6. Open **PowerShell** on your computer and run:
   ```powershell
   aws configure
   ```
7. Paste your `Access Key ID` and press Enter.
8. Paste your `Secret Access Key` and press Enter.
9. For Default region name, type: `us-east-1`
10. For Default output format, type: `json`

---

## Phase 2: Deploy Infrastructure (AWS Console)

Now we will use CloudFormation to automatically build our Database, Networking, and Servers!

1. In the AWS Console search bar at the top, type **CloudFormation** and open it.
2. In the top right, click **Create stack** -> **With new resources (standard)**.
3. Under **Specify template**, select **Upload a template file**.
4. Click **Choose file** and select the `cloudformation/single-click-deploy.yaml` file from your project folder.
5. Click **Next**.
6. **Specify stack details**:
   - **Stack name**: `serviconnect-dev-stack`
   - **AvailabilityZone1**: Select `us-east-1a`
   - **AvailabilityZone2**: Select `us-east-1b`
7. Click **Next**.
8. **Configure stack options**: Scroll to the absolute bottom and click **Next**.
9. **Review**: Scroll to the absolute bottom again.
   - Check the box: **"I acknowledge that AWS CloudFormation might create IAM resources with custom names."**
   - Click **Submit**.

> [!NOTE]
> AWS is now building your infrastructure! This takes about **10-15 minutes**. 
> The ECS Service will initially fail to start because we haven't uploaded our code yet. That is normal! Proceed to Phase 3.

---

## Phase 3: Uploading the Backend Code

Once your CloudFormation stack says `CREATE_COMPLETE` (or while it's building, once the `BackendRepository` resource is created), we need to upload your backend code.

1. Open **PowerShell** and navigate to your project's backend folder:
   ```powershell
   cd C:\Users\saisu\OneDrive\Desktop\gowtham\servi-connect\backend
   ```
2. Get your AWS Account ID by running:
   ```powershell
   aws sts get-caller-identity --query Account --output text
   ```
   *(Copy this 12-digit number, you will use it to replace `<YOUR_ACCOUNT_ID>` below)*

3. Log in Docker to AWS:
   ```powershell
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
   ```

4. Build the Docker image:
   ```powershell
   docker build -t serviconnect-dev-backend .
   ```

5. Tag the image for AWS:
   ```powershell
   docker tag serviconnect-dev-backend:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/serviconnect-dev-backend:latest
   ```

6. Push the image to AWS:
   ```powershell
   docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/serviconnect-dev-backend:latest
   ```

*(Once pushed, AWS will automatically detect your code and start the backend server!)*

---

## Phase 4: Deploying the Frontend

Now we just need to link your frontend website to the new backend!

1. Go back to your CloudFormation stack in the AWS Console.
2. Click on the **Outputs** tab. You will see several values we need.
3. Open `C:\Users\saisu\OneDrive\Desktop\gowtham\servi-connect\frontend\public\js\config.js` in your code editor.
4. Update the values to match your CloudFormation outputs:
   ```javascript
   window.__SERVICONNECT_CONFIG__ = {
     API_BASE_URL: 'http://<Paste AlbDnsName Here>',
     COGNITO_USER_POOL_ID: '<Paste CognitoUserPoolId Here>',
     COGNITO_CLIENT_ID: '<Paste CognitoClientId Here>',
     AWS_REGION: 'us-east-1'
   };
   ```
5. Save the file.
6. In the AWS Console search bar, type **S3** and open it.
7. Click on your new bucket (it will be named something like `serviconnect-dev-frontend-...`).
8. Click the **Upload** button.
9. Drag and drop **all files and folders** from inside your `frontend/public/` folder into the browser window.
10. Click **Upload** at the bottom.

---

## 🎉 Verification

Your app is now live! 

Go back to your CloudFormation **Outputs** tab, find the `CloudfrontUrl` (e.g., `d12345abcdef.cloudfront.net`), and open it in your web browser. 

You should see the ServiConnect application running perfectly!
