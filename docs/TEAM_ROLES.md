# ServiConnect — 6-Member Team Roles

## Team Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   ServiConnect Team                         │
│                                                             │
│  Member 1 ──── Infrastructure Lead (XXXX)                │
│  Member 2 ──── Backend Developer                            │
│  Member 3 ──── Frontend Developer                           │
│  Member 4 ──── AI/ML Engineer                               │
│  Member 5 ──── Database Engineer                            │
│  Member 6 ──── Security & QA Engineer                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 👑 Member 1 — Infrastructure Lead ()

**Responsibilities:**+
- Overall AWS architecture design
- All core Terraform infrastructure (VPC, ECS, ALB, ECR)
- Docker containerization of the backend
- CI/CD pipeline setup (GitHub Actions → AWS)
- Terraform state management (S3 + DynamoDB)
- Final deployment orchestration
- Code review and PR approvals
- GitHub repository setup and branch protection

**Branch:** `infra/terraform-core`

**Files Owned:**
- `terraform/provider.tf` — AWS provider + remote state config
- `terraform/main.tf` — Root module wiring all components
- `terraform/variables.tf` — All input variable declarations
- `terraform/outputs.tf` — Post-deploy URLs and identifiers
- `terraform/modules/vpc/` — VPC, subnets, NAT gateway, routing
- `terraform/modules/ecr/` — Docker image registry
- `terraform/modules/ecs/` — ECS Fargate cluster, task definition, service
- `terraform/modules/alb/` — Application Load Balancer
- `terraform/modules/cloudwatch/` — Logs, alarms, dashboards
- `terraform/environments/dev/terraform.tfvars`
- `terraform/environments/prod/terraform.tfvars`
- `backend/Dockerfile` — Multi-stage production build
- `backend/docker-compose.yml` — Local development environment
- `Makefile` — Common developer commands
- `.github/workflows/terraform-plan.yml`

**Daily Tasks:**
1. Review PRs from all members
2. Maintain Terraform modules
3. Monitor ECS deployments in CloudWatch
4. Update infrastructure as team needs evolve

---

## 🔧 Member 2 — Backend Developer

**Responsibilities:**
- Node.js/Express API development
- PostgreSQL integration (Sequelize ORM)
- Authentication and authorization logic
- API security middleware (Helmet, rate limiting, CORS)
- No-hardcoding refactor (AWS config loader)
- Backend testing with Jest

**Branch:** `feature/backend-api`

**Files Owned:**
- `backend/server.js` — App entry point, async config loading
- `backend/config/aws.js` — Secrets Manager + Parameter Store loader
- `backend/config/database.js` — Sequelize + PostgreSQL connection
- `backend/routes/auth.js` — Register/login for customers and workers
- `backend/routes/customer.js` — Customer booking, worker browse routes
- `backend/routes/worker.js` — Worker job management routes
- `backend/middleware/auth.js` — JWT protect + authorize helpers
- `backend/middleware/errorHandler.js` — Global error handling
- `backend/middleware/rateLimiter.js` — Auth and API rate limiting
- `backend/middleware/security.js` — Helmet + CORS from config
- `backend/.env.example` — Documentation of all environment variables
- `backend/package.json` — All Node.js dependencies
- `.github/workflows/backend-ci.yml` — Test + build + deploy pipeline

**Environment Variables Responsibility:**
```
JWT_SECRET, JWT_EXPIRE, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS,
PORT, NODE_ENV, FRONTEND_URL, AWS_REGION
```

---

## 🎨 Member 3 — Frontend Developer

**Responsibilities:**
- HTML/CSS/JS frontend pages
- Removing hardcoded API URLs (using config.js)
- S3 static hosting configuration (Terraform)
- CloudFront CDN setup
- Frontend deployment scripts
- Integrating AI chatbot widget

**Branch:** `feature/frontend-ui`

**Files Owned:**
- `frontend/public/index.html` — Landing page
- `frontend/public/pages/customer-login.html`
- `frontend/public/pages/worker-login.html`
- `frontend/public/pages/customer-dashboard.html`
- `frontend/public/pages/worker-dashboard.html`
- `frontend/public/css/shared.css` — All styles
- `frontend/public/js/config.js` — Runtime config (no hardcoding)
- `frontend/public/js/api.js` — API client + auth helpers
- `frontend/public/js/ai-chat.js` — ServiBot chatbot widget
- `terraform/modules/s3-cloudfront/` — S3 + CloudFront Terraform
- `scripts/deploy-frontend.sh` — Manual deploy script
- `.github/workflows/frontend-ci.yml` — Frontend CI pipeline

**Key Rule:** NEVER hardcode API URL. Always use `window.__SERVICONNECT_CONFIG__.API_BASE_URL`

---

## 🤖 Member 4 — AI/ML Engineer

**Responsibilities:**
- AWS Bedrock integration (Claude models)
- Smart worker matching AI
- AI price estimation feature
- Customer support chatbot (ServiBot)
- Review sentiment analysis (Amazon Comprehend)
- AI API endpoints
- Documentation of AI features

**Branch:** `feature/ai-bedrock`

**Files Owned:**
- `backend/services/bedrockService.js` — Base Bedrock client
- `backend/services/workerMatchingAI.js` — AI job-to-worker matching
- `backend/services/priceEstimationAI.js` — AI price suggestions in INR
- `backend/services/chatbotService.js` — ServiBot support chatbot
- `backend/services/reviewSentimentService.js` — Amazon Comprehend sentiment
- `backend/routes/ai.js` — AI endpoints (/price-estimate, /match-workers, /chat)
- `terraform/modules/bedrock/` — Bedrock IAM permissions
- `docs/ai-features.md` — AI features documentation

**AWS Services Used:** Bedrock (Claude 3 Haiku/Sonnet), Amazon Comprehend

**Bedrock Models:**
- Claude 3 Haiku: Price estimation, chatbot (fast + cheap)
- Claude 3 Sonnet: Worker matching (higher accuracy, used in prod)

---

## 🗄️ Member 5 — Database Engineer

**Responsibilities:**
- PostgreSQL schema design
- Sequelize models and associations
- Database migrations (version-controlled schema changes)
- Data seeders (realistic demo data)
- RDS Terraform module
- Database backup strategy

**Branch:** `feature/database-rds`

**Files Owned:**
- `backend/models/Customer.js` — Customer Sequelize model
- `backend/models/Worker.js` — Worker Sequelize model (with skills array)
- `backend/models/Booking.js` — Booking model (with AI fields)
- `backend/models/Review.js` — Review model (with sentiment fields)
- `backend/models/index.js` — Model initialization + associations
- `migrations/001-create-customers.js`
- `migrations/002-create-workers.js`
- `migrations/003-create-bookings.js`
- `migrations/004-create-reviews.js`
- `seeders/001-demo-data.js` — Demo customers, workers, bookings
- `terraform/modules/rds/` — RDS PostgreSQL Terraform module
- `scripts/db-migrate.sh` — Production migration script
- `.github/workflows/db-check.yml` — Migration validation CI

**Database Rules:**
- Always create a migration for every schema change
- Never modify production DB directly — always use migrations
- Passwords stored as bcrypt hashes (cost=12), never plaintext

---

## 🔐 Member 6 — Security & QA Engineer

**Responsibilities:**
- AWS IAM roles and least-privilege policies
- AWS WAF rules (OWASP protection, SQLi, rate limiting)
- AWS Cognito user pool configuration
- AWS Secrets Manager setup
- Security testing and vulnerability scanning
- Jest API tests
- Security policy documentation

**Branch:** `feature/security-auth`

**Files Owned:**
- `terraform/modules/iam/` — ECS roles with least-privilege policies
- `terraform/modules/cognito/` — User pool, app client, auth flows
- `terraform/modules/waf/` — WAF rules on ALB (OWASP, SQLi, rate limit)
- `terraform/modules/secrets-manager/` — Auto-generated secrets
- `backend/middleware/cognitoAuth.js` — Cognito JWT verification
- `tests/auth.test.js` — Auth endpoint tests
- `tests/api.test.js` — Customer + worker API tests
- `docs/security-policy.md` — Security practices document
- `docs/iam-roles.md` — IAM roles reference
- `.github/workflows/security-scan.yml` — npm audit + SAST scan
- `.github/workflows/run-tests.yml` — All tests CI

**Security Principles Enforced:**
1. Zero hardcoded secrets anywhere in codebase
2. Least-privilege IAM — each role has only what it needs
3. All DB traffic over SSL (RDS + Sequelize)
4. WAF protects ALB from OWASP Top 10 attacks
5. Brute-force protection on login (rate limiter + WAF)
6. All secrets auto-generated by Terraform (no human-chosen passwords)
