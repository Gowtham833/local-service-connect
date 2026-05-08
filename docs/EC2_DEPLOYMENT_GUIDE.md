# ServiConnect: Complete EC2 Deployment Guide

Since you are starting fresh, this guide will walk you step-by-step through deploying your project to a Virtual Machine (EC2) using the **`cloudformation/ec2-single-click.yaml`** template. This method is the absolute easiest way for beginners to launch their web app!

Follow these steps exactly in order. Do not skip any steps!

---

## Phase 1: Preparation (The SSH Key)

Because your application runs on an EC2 server (a virtual machine), you **must** have a secure key to log into it and upload your code. If you haven't created one yet, or lost yours:

1. Open the **AWS Console** and search for **EC2**.
2. In the left sidebar, scroll down to **Network & Security** and click **Key Pairs**.
3. Click the orange **Create key pair** button.
4. Name it exactly: `serviconnect-key`
5. Key pair type: **RSA**
6. Private key file format: **.pem** (for use with OpenSSH/PowerShell).
7. Click **Create key pair**. The `serviconnect-key.pem` file will automatically download to your `Downloads` folder.
8. **CRITICAL:** Open your Downloads folder, and **move** the `serviconnect-key.pem` file directly into your main project folder (`C:\Users\saisu\OneDrive\Desktop\gowtham\servi-connect\`).

---

## Phase 2: Deploy the Infrastructure

We are going to use the special EC2 deployment template I created for you.

1. Open the **AWS Console** and search for **CloudFormation**.
2. Click **Create stack** (With new resources (standard)).
3. Choose **Upload a template file**.
4. Click "Choose file" and select this exact file from your project:
   👉 `cloudformation/ec2-single-click.yaml`
5. Click Next.
6. Give your stack a name: `serviconnect-ec2-stack`
7. In the parameters:
   - **AvailabilityZone1**: Select any zone from the dropdown (e.g., `us-east-1a`).
   - **AvailabilityZone2**: Select a DIFFERENT zone from the dropdown (e.g., `us-east-1b`). *(Must be different from Zone 1!)*
   - **KeyPairName**: Select `serviconnect-key` from the dropdown.
   - **DbPassword**: Type a secure password (must be at least 8 characters, like `ServiConnect123!`). *Remember this!*
8. Click Next until the end, and click **Submit**.
9. Wait ~5-7 minutes for the stack status to say **CREATE_COMPLETE**.

---

## Phase 3: Get Your Server IP

1. Click on your newly created stack (`serviconnect-ec2-stack`).
2. Click on the **Outputs** tab.
3. Look for **`BServerIP`** and copy the IP address (e.g., `34.206.157.146`).

---

## Phase 4: Update Your Frontend Config

Before uploading your code, you need to tell your frontend where the API is.

1. Open your code editor and go to:
   `frontend/public/js/config.js`
2. Change the `API_BASE_URL` to match your new EC2 Server IP. Make sure to keep `http://`:
   ```javascript
   window.__SERVICONNECT_CONFIG__ = window.__SERVICONNECT_CONFIG__ || {
     API_BASE_URL: 'http://<YOUR_EC2_IP>', // Example: 'http://34.206.157.146'
     COGNITO_USER_POOL_ID: '', // Leave blank
     COGNITO_CLIENT_ID: '',    // Leave blank
     AWS_REGION: 'us-east-1',
   };
   ```
3. Save the file!

---

## Phase 5: Upload Your Code to the Server

Now you will upload your code from your Windows computer to the AWS Server. *If you do not do this, your backend will show a 502 Bad Gateway error and you won't be able to log in!*

1. Open **PowerShell**.
2. Navigate to your project folder where your `.pem` key is located:
   ```powershell
   cd C:\Users\saisu\OneDrive\Desktop\gowtham\servi-connect
   ```
3. **Upload the Backend:** (Replace `<YOUR_EC2_IP>` with your actual server IP)
   ```powershell
   scp -i serviconnect-key.pem -r ./backend/* ec2-user@<YOUR_EC2_IP>:/home/ec2-user/app/backend/
   ```
4. **Upload the Frontend:** (Replace `<YOUR_EC2_IP>` with your actual server IP)
   ```powershell
   scp -i serviconnect-key.pem -r ./frontend/public/* ec2-user@<YOUR_EC2_IP>:/home/ec2-user/app/frontend/public/
   ```

*(Note: If PowerShell asks "Are you sure you want to continue connecting?", type **yes** and press Enter).*

---

## Phase 6: Start the Application

Your code is on the server, but it is asleep. You need to wake it up!

1. **Log into the server** using SSH in your PowerShell:
   ```powershell
   ssh -i serviconnect-key.pem ec2-user@<YOUR_EC2_IP>
   ```
2. You will see the prompt change to `[ec2-user@ip-...]`. You are now inside the AWS server!
3. **Run the Startup Script:**
   ```bash
   bash ~/start-app.sh
   ```
4. Wait for the script to finish. It will automatically install all the dependencies, start your backend server using `pm2`, and sync the database models.

---

## 🎉 Phase 7: Verification

You are done! 

Open your web browser and go to your server's IP address:
👉 `http://<YOUR_EC2_IP>`

1. You should see your ServiConnect homepage.
2. Click **Login** or **Register** to create a Worker/Customer account.
3. Because the backend is now running properly, the database will save your accounts successfully!
