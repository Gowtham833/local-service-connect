# ServiConnect — GitHub Team Workflow
# Complete Git Commands for All 6 Members

## STEP 0: One-Time Setup (Gowtham/Lead does this ONCE)

```bash
# On GitHub.com — Create the repository
# 1. Go to https://github.com/new
# 2. Repository name: serviconnect
# 3. Set to Private (recommended)
# 4. Do NOT initialize with README (we already have code)
# 5. Click "Create repository"

# In your LOCAL terminal (Gowtham's machine):
cd C:\Users\saisu\OneDrive\Desktop\gowtham\serviconnect

# Initialize git if not already done
git init
git branch -M main

# Add remote (replace YOUR_GITHUB_USERNAME)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/serviconnect.git

# First commit on main — push the base project
git add .
git commit -m "chore: initial project setup with AWS deployment structure"
git push -u origin main

# Create and push develop branch
git checkout -b develop
git push -u origin develop
```

---

## STEP 1: Invite All 6 Team Members

```
GitHub.com → Your Repo → Settings → Collaborators & teams
→ Add people (enter each member's GitHub username)
→ Role: Write
```

---

## STEP 2: Each Member Clones and Creates Their Branch

### 👑 Member 1 — Gowtham (Infrastructure Lead)
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/serviconnect.git
cd serviconnect
git checkout develop
git checkout -b infra/terraform-core
git push -u origin infra/terraform-core
```
**Work on:** terraform/, Dockerfile, docker-compose.yml, Makefile, .github/workflows/terraform-plan.yml

---

### 🔧 Member 2 — Backend Developer
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/serviconnect.git
cd serviconnect
git checkout develop
git checkout -b feature/backend-api
git push -u origin feature/backend-api
```
**Work on:** backend/server.js, backend/config/, backend/routes/, backend/middleware/, backend/.env.example

---

### 🎨 Member 3 — Frontend Developer
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/serviconnect.git
cd serviconnect
git checkout develop
git checkout -b feature/frontend-ui
git push -u origin feature/frontend-ui
```
**Work on:** frontend/, terraform/modules/s3-cloudfront/, .github/workflows/frontend-ci.yml, scripts/deploy-frontend.sh

---

### 🤖 Member 4 — AI/ML Engineer
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/serviconnect.git
cd serviconnect
git checkout develop
git checkout -b feature/ai-bedrock
git push -u origin feature/ai-bedrock
```
**Work on:** backend/services/, backend/routes/ai.js, terraform/modules/bedrock/

---

### 🗄️ Member 5 — Database Engineer
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/serviconnect.git
cd serviconnect
git checkout develop
git checkout -b feature/database-rds
git push -u origin feature/database-rds
```
**Work on:** backend/models/, migrations/, seeders/, terraform/modules/rds/, scripts/db-migrate.sh

---

### 🔐 Member 6 — Security/QA Engineer
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/serviconnect.git
cd serviconnect
git checkout develop
git checkout -b feature/security-auth
git push -u origin feature/security-auth
```
**Work on:** terraform/modules/iam/, terraform/modules/cognito/, terraform/modules/waf/, terraform/modules/secrets-manager/, tests/, .github/workflows/security-scan.yml

---

## STEP 3: Daily Work Cycle (Every Developer)

```bash
# 1. Start your day — pull latest changes from develop
git checkout develop
git pull origin develop
git checkout YOUR-BRANCH
git merge develop    # Bring in others' changes

# 2. Make your changes, then:
git status           # See what changed
git add .            # Stage all changes (or: git add specific-file.js)
git commit -m "feat(backend): add PostgreSQL Sequelize models"
git push origin YOUR-BRANCH

# 3. When feature is ready — open Pull Request on GitHub:
#    YOUR-BRANCH → develop
#    Assign 1 reviewer
#    Wait for approval, then merge

# 4. After PR merged to develop → Gowtham merges develop → main
#    (This triggers the CI/CD pipeline to deploy)
```

---

## STEP 4: Commit Message Convention

Follow this format so the team stays consistent:

```
<type>(<scope>): <description>

Types:
  feat     - New feature
  fix      - Bug fix
  chore    - Setup/config changes
  docs     - Documentation
  refactor - Code refactor (no behavior change)
  test     - Tests
  infra    - Terraform/AWS changes
  ci       - CI/CD changes

Examples:
  feat(backend): add Bedrock worker matching endpoint
  fix(frontend): correct API base URL loading from config.js
  infra(terraform): add WAF module to ALB
  docs: add deployment guide
  test(backend): add auth endpoint tests
```

---

## STEP 5: Handling Merge Conflicts

```bash
# If you get a merge conflict:
git checkout YOUR-BRANCH
git merge develop
# Git will mark conflicts in files. Open the file and fix them.
# Look for: <<<<<<< HEAD ... ======= ... >>>>>>> develop
# Fix the code, then:
git add .
git commit -m "fix: resolve merge conflict with develop"
git push
```

---

## STEP 6: GitHub Repository Secrets (Gowtham sets these)

```
Go to: GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets (values come after Terraform deploy):
  AWS_DEPLOY_ROLE_ARN      = arn:aws:iam::ACCOUNT:role/github-actions-deploy
  AWS_REGION               = us-east-1
  ECR_REPOSITORY_NAME      = serviconnect-dev-backend
  ECS_CLUSTER_NAME         = serviconnect-dev-cluster
  ECS_SERVICE_NAME         = serviconnect-dev-service
  S3_BUCKET_NAME           = (from terraform output s3_bucket_name)
  CLOUDFRONT_DISTRIBUTION_ID = (from terraform output cloudfront_id)
  BACKEND_API_URL          = http://(from terraform output alb_dns_name)
  COGNITO_USER_POOL_ID     = (from terraform output cognito_user_pool_id)
  COGNITO_CLIENT_ID        = (from terraform output cognito_client_id)
```

---

## Branch Protection Rules (Gowtham sets on GitHub)

```
GitHub → Repo → Settings → Branches → Add rule

Branch: main
✅ Require a pull request before merging
✅ Require 1 approving review
✅ Require status checks to pass (select: test, build-push)
✅ Do not allow bypassing the above settings

Branch: develop
✅ Require a pull request before merging
✅ Require 1 approving review
```
