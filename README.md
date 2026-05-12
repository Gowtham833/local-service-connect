# ServiConnect 🔧

> **Smart Local On-Demand Services Platform**
> *Right Worker. Right Time. Right at Your Door.*

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-v4.18-black?logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15-blue?logo=postgresql)](https://postgresql.org)
[![AWS](https://img.shields.io/badge/AWS-CloudFormation-orange?logo=amazonaws)](https://aws.amazon.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.8-white?logo=socket.io)](https://socket.io)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

🌐 **Live:** [https://serviconnect.me](https://serviconnect.me) &nbsp;|&nbsp; [http://54.211.227.127](http://54.211.227.127)

---

## 🌟 Overview

ServiConnect is a **production-grade, full-stack platform** connecting local customers with verified on-demand service workers — plumbers, electricians, carpenters, cleaners, AC technicians, and more — in real time. Built from scratch with a premium glassmorphism UI, AI-powered features, and enterprise AWS deployment.

### ✨ Key Highlights

| Feature | Description |
|---------|-------------|
| 🔐 Password Login | Secure bcrypt-hashed login for customers & workers |
| 📱 OTP Verification | AWS SNS SMS for registration & password reset |
| 📢 Worker SMS Alerts | Up to 5 matched workers notified per new job request |
| 🗺️ Live Tracking | OpenStreetMap + Leaflet.js + Socket.io real-time GPS |
| 🤖 AI Chatbot | AWS Bedrock Claude 3 Haiku — 24/7 customer support |
| 🎯 Smart Matching | AI-powered worker recommendation engine |
| 💰 Price Estimation | Dynamic AI pricing based on service & location |
| 🆔 Aadhaar KYC | Worker identity verification with secure document upload |
| 📸 Profile Photos | Upload & display profile images on dashboards |
| 🎨 Premium UI | Dark glassmorphism with 3D isometric illustrations |
| 🔒 SSL/HTTPS | Let's Encrypt auto-renewing certificate |
| ☁️ AWS Infrastructure | CloudFormation, EC2, RDS, SNS, SQS, Bedrock |

---

## 📁 Project Structure

```
servi-connect/
├── backend/                       # Node.js + Express API (v2.0)
│   ├── server.js                  # Entry — Express + Socket.io + SQS worker
│   ├── config/
│   │   ├── aws.js                 # AWS Secrets Manager / .env config loader
│   │   └── database.js            # Sequelize connection factory
│   ├── controllers/
│   │   └── locationController.js  # GPS location update logic
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + role authorization
│   │   ├── security.js            # Helmet, CORS configuration
│   │   ├── rateLimiter.js         # express-rate-limit (100 req/15min)
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   ├── Customer.js            # Customer schema (phone, name, profilePhotoUrl)
│   │   ├── Worker.js              # Worker schema (skills, Aadhaar, rating, GPS)
│   │   ├── Booking.js             # Booking lifecycle (pending→accepted→completed)
│   │   ├── Review.js              # Star ratings + text reviews
│   │   ├── PasswordResetToken.js  # OTP tokens (registration & reset)
│   │   ├── userLocation.js        # GPS coordinate history
│   │   ├── store.js               # In-memory OTP store
│   │   └── index.js               # Sequelize init + model associations
│   ├── routes/
│   │   ├── auth.js                # Register, login, OTP, forgot password
│   │   ├── customer.js            # Bookings, tracking, ratings, profile
│   │   ├── worker.js              # Jobs, availability, location, profile
│   │   ├── ai.js                  # Chatbot, matching, price estimation
│   │   ├── admin.js               # Dashboard stats, worker verification
│   │   └── locationRoutes.js      # GPS update endpoint
│   ├── services/
│   │   ├── smsService.js          # AWS SNS — OTP + job notification SMS
│   │   ├── socketService.js       # Socket.io — real-time events
│   │   ├── sqsService.js          # AWS SQS — async message queue
│   │   ├── chatbotService.js      # AWS Bedrock Claude — AI chatbot
│   │   ├── workerMatchingAI.js    # Intelligent worker recommendation
│   │   ├── priceEstimationAI.js   # Dynamic price estimation
│   │   ├── bedrockService.js      # AWS Bedrock base client
│   │   ├── reviewSentimentService.js # AI review sentiment analysis
│   │   ├── faceMatchService.js    # Face verification service
│   │   └── uploadService.js       # Base64 image → disk storage
│   ├── workers/
│   │   └── dbWorker.js            # SQS consumer + worker SMS notifications
│   ├── migrations/                # Sequelize DB migrations
│   ├── tests/
│   │   ├── api.test.js            # API integration tests
│   │   └── auth.test.js           # Authentication unit tests
│   ├── uploads/                   # Profile photos, Aadhaar docs, etc.
│   ├── Dockerfile                 # Multi-stage Docker build (node:20-alpine)
│   ├── docker-compose.yml         # Backend + PostgreSQL local dev
│   ├── package.json               # Dependencies & scripts
│   ├── seed.js                    # Database seeder
│   └── .env.example               # Environment variables template
│
├── frontend/
│   └── public/                    # Served as static files
│       ├── index.html             # Landing page (3D isometric hero)
│       ├── images/                # Generated 3D illustrations
│       ├── css/
│       │   └── shared.css         # Premium dark glassmorphism styles
│       ├── js/
│       │   ├── api.js             # Auth helpers + REST API client
│       │   ├── config.js          # Runtime config loader
│       │   └── ai-chat-v2.js      # ServiBot AI chatbot widget
│       └── pages/
│           ├── customer-login.html     # Customer login + signup
│           ├── customer-dashboard.html # Book, track, rate services
│           ├── worker-login.html       # Worker login + Aadhaar registration
│           ├── worker-dashboard.html   # Jobs, map, earnings
│           ├── tracking.html           # Real-time worker tracking map
│           ├── admin-login.html        # Admin login
│           └── admin-dashboard.html    # Admin panel
│
├── cloudformation/                # AWS Infrastructure as Code
│   ├── single-click-deploy.yaml   # Full-stack AWS (VPC, ECS, RDS, ALB, S3)
│   ├── ec2-single-click.yaml      # Simplified EC2 deployment
│   ├── master.yaml                # Nested stack orchestrator
│   └── templates/                 # Component CloudFormation templates
│
├── terraform/                     # Alternative IaC (Terraform)
│   ├── main.tf, variables.tf, outputs.tf, provider.tf
│   ├── modules/                   # Reusable Terraform modules
│   └── environments/              # Dev/prod tfvars
│
├── .github/workflows/             # CI/CD Pipelines
│   ├── backend-ci.yml             # Backend lint + test + build
│   ├── frontend-ci.yml            # Frontend validation
│   ├── db-check.yml               # Database migration checks
│   ├── security-scan.yml          # Dependency vulnerability scan
│   └── terraform-plan.yml         # Terraform plan on PR
│
├── docs/                          # Documentation
│   ├── BEGINNER_DEPLOYMENT_GUIDE.md
│   ├── EC2_DEPLOYMENT_GUIDE.md
│   ├── DEPLOYMENT_GUIDE_CLOUDFORMATION.md
│   ├── DEPLOYMENT_GUIDE_TERRAFORM.md
│   ├── GITHUB_WORKFLOW.md
│   ├── TEAM_ROLES.md
│   ├── ai-features.md
│   └── iam-roles.md
│
├── scripts/
│   ├── db-migrate.sh              # Database migration script
│   └── deploy-frontend.sh         # Frontend S3 deployment
│
├── nginx.conf                     # Nginx reverse proxy + SSL config
├── Makefile                       # Developer automation commands
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v18+ | Runtime |
| PostgreSQL | v14+ | Database |
| Git | any | Version control |

### Local Development

```bash
# Clone the repository
git clone https://github.com/Gowtham833/local-service-connect.git
cd local-service-connect

# Configure environment
cd backend
cp .env.example .env
# Edit .env with your DB credentials, JWT secret, AWS keys

# Setup database
psql -U postgres -c "CREATE DATABASE serviconnect;"
npm install
npm run migrate

# Start development server
npm run dev
```

### Docker Development

```bash
cd backend
docker-compose up --build
# App: http://localhost:5000 | DB: localhost:5432
```

### Makefile Shortcuts

```bash
make dev-backend    # Start backend locally
make dev-docker     # Start with Docker Compose
make migrate        # Run DB migrations
make seed           # Seed sample data
make test           # Run tests with coverage
make build-docker   # Build Docker image
make deploy-frontend # Upload frontend to S3
```

Open **http://localhost:5000** — Express serves both API and frontend.

---

## 🔗 Application Pages

| URL | Page | Auth Required |
|-----|------|:------------:|
| `/` | 🏠 Landing page | — |
| `/pages/customer-login.html` | 👤 Customer login / signup | — |
| `/pages/customer-dashboard.html` | 📋 Customer dashboard | ✅ Customer |
| `/pages/worker-login.html` | 🔧 Worker login / registration | — |
| `/pages/worker-dashboard.html` | 🗺️ Worker dashboard | ✅ Worker |
| `/pages/tracking.html` | 📍 Real-time worker tracking | ✅ Customer |
| `/pages/admin-login.html` | 🛡️ Admin login | — |
| `/pages/admin-dashboard.html` | ⚙️ Admin panel | ✅ Admin |

---

## 🔌 REST API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register/send-otp` | Send OTP for registration |
| `POST` | `/customer/register` | Register customer (with OTP) |
| `POST` | `/customer/login` | Login with phone + password |
| `POST` | `/worker/register` | Register worker (Aadhaar + OTP) |
| `POST` | `/worker/login` | Login with phone + password |
| `POST` | `/admin/login` | Admin login (username/password) |
| `POST` | `/login/send-otp` | Send OTP for login (legacy) |
| `POST` | `/forgot-password` | Send password reset OTP |
| `POST` | `/verify-otp` | Verify OTP code |
| `POST` | `/reset-password` | Set new password with reset token |
| `POST` | `/customer/reset-password` | Customer-specific password reset |
| `POST` | `/worker/reset-password` | Worker-specific password reset |

### Customer — `/api/customer` *(Bearer Token)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/me` | Profile + stats + recent bookings |
| `GET` | `/workers` | Browse available workers |
| `POST` | `/bookings` | Post new service request |
| `GET` | `/bookings` | List all bookings |
| `PATCH` | `/bookings/:id/rate` | Rate a completed booking |
| `GET` | `/bookings/:id/tracking` | Live worker tracking data |
| `PATCH` | `/location` | Update customer GPS |
| `PATCH` | `/profile` | Update profile + photo upload |

### Worker — `/api/worker` *(Bearer Token)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/me` | Profile + stats + job history |
| `PATCH` | `/availability` | Toggle online/offline |
| `PATCH` | `/location` | Update GPS coordinates |
| `GET` | `/open-jobs` | Available jobs matching skills |
| `PATCH` | `/jobs/:id/accept` | Accept an open job |
| `PATCH` | `/jobs/:id/start` | Start working on accepted job |
| `PATCH` | `/jobs/:id/complete` | Complete job + set price |
| `GET` | `/verification-status` | Check Aadhaar verification |
| `PATCH` | `/profile` | Update profile + photo upload |

### AI — `/api/ai` *(Bearer Token)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | AI chatbot (Bedrock Claude 3 Haiku) |
| `POST` | `/match-workers` | AI worker recommendation |
| `GET` | `/price-estimate` | AI dynamic price estimation |

### Admin — `/api/admin` *(Bearer Token)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stats` | Platform-wide statistics |
| `GET` | `/workers` | List all registered workers |
| `GET` | `/workers/:id` | Worker detail view |
| `PATCH` | `/workers/:id/verify` | Approve/reject worker KYC |
| `GET` | `/bookings` | All bookings with filters |
| `GET` | `/bookings/:id` | Booking detail view |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check (DB connectivity) |

---

## 🧠 AI Features (AWS Bedrock)

| Feature | Model | Description |
|---------|-------|-------------|
| 🤖 ServiBot Chatbot | Claude 3 Haiku | 24/7 conversational support with Telugu language support |
| 🎯 Smart Worker Matching | Scoring Algorithm | Ranks workers by rating, distance, skills, response time |
| 💰 Price Estimation | Claude 3 Haiku | Dynamic pricing based on service type, duration, location |
| 📝 Review Sentiment | Comprehend | Detects fake/spam reviews using sentiment analysis |

---

## 📱 SMS Notifications (AWS SNS)

| Trigger | Recipients | Message |
|---------|-----------|---------|
| Customer/Worker Registration | Registering user | 6-digit OTP code |
| Forgot Password | Requesting user | 6-digit reset OTP |
| New Service Request Posted | Up to 5 matched workers | Job alert with service type & area |

> ⚠️ **AWS SNS Sandbox:** New AWS accounts start in sandbox mode. Add phone numbers manually for testing, or [request production access](https://docs.aws.amazon.com/sns/latest/dg/sns-sms-sandbox.html) for universal delivery.

---

## 🗺️ Real-Time Features (Socket.io)

- **📍 Live Worker Location** — GPS coordinates streamed to customer's Leaflet.js map
- **🔔 Instant Job Alerts** — Workers receive real-time push for new requests
- **📊 Status Updates** — Booking lifecycle events broadcast live (pending → accepted → en-route → completed)

---

## 🎨 UI/UX Design

The frontend uses a **premium dark-mode glassmorphism** aesthetic:

- **Landing Page** — Split hero with 3D isometric illustration, floating emoji icons, animated gradient orbs, glassmorphism service cards
- **Login Pages** — Glass containers with floating decorative service icons
- **Dashboards** — Card-based layouts with real-time stat widgets, interactive maps
- **ServiBot Widget** — Violet-themed floating AI chatbot
- **Typography** — Google Fonts (Syne + DM Sans)
- **Animations** — CSS keyframe floating, pulsing markers, smooth hover transitions
- **Responsive** — Mobile-first grid layouts

---

## 🔐 Security

| Layer | Implementation |
|-------|---------------|
| Authentication | JWT (jsonwebtoken v9, 7-day expiry) |
| Password Hashing | bcryptjs (12 salt rounds) |
| OTP Delivery | AWS SNS (6-digit, 5-min expiry) |
| Rate Limiting | express-rate-limit (100 req/15min) |
| HTTP Headers | Helmet.js (CSP, HSTS, XSS protection) |
| Identity Verification | Aadhaar upload → Admin approval flow |
| Input Validation | express-validator on all POST/PATCH routes |
| File Upload | Multer (50MB limit) + base64 encoding |
| HTTPS/SSL | Let's Encrypt (auto-renewing via Certbot) |
| Secrets | AWS Secrets Manager (production) / .env (dev) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js v18+ |
| **Framework** | Express v4.18 |
| **Database** | PostgreSQL v15 + Sequelize v6 ORM |
| **Real-time** | Socket.io v4.8 |
| **Auth** | JWT + bcryptjs |
| **SMS/OTP** | AWS SNS |
| **AI/ML** | AWS Bedrock (Claude 3 Haiku) + AWS Comprehend |
| **Queue** | AWS SQS |
| **Maps** | OpenStreetMap + Leaflet.js |
| **File Upload** | Multer + Local disk (S3-ready) |
| **Frontend** | Vanilla HTML/CSS/JS (Glassmorphism) |
| **IaC** | AWS CloudFormation + Terraform |
| **CI/CD** | GitHub Actions (5 workflows) |
| **Container** | Docker + Docker Compose |
| **Proxy** | Nginx (reverse proxy + SSL termination) |
| **Process Mgr** | PM2 |
| **Testing** | Jest + Supertest |

---

## ☁️ Production Deployment

### Current Live Server

| Component | Details |
|-----------|---------|
| **URL** | https://serviconnect.me |
| **IP** | 54.211.227.127 |
| **Server** | AWS EC2 (Amazon Linux 2023) |
| **Database** | AWS RDS PostgreSQL (SSL) |
| **SSL** | Let's Encrypt (auto-renew) |
| **Process** | PM2 (auto-restart) |
| **Proxy** | Nginx (port 80/443 → 5000) |
| **DNS** | AWS Route 53 + Namecheap |

### CloudFormation (Enterprise)

Upload `cloudformation/single-click-deploy.yaml` to the AWS Console for automated deployment:
- VPC with public/private subnets
- ECS Fargate cluster
- RDS PostgreSQL
- Application Load Balancer
- S3 + CloudFront (frontend CDN)
- Auto-scaling policies

See [BEGINNER_DEPLOYMENT_GUIDE.md](./docs/BEGINNER_DEPLOYMENT_GUIDE.md) for step-by-step instructions.

### Terraform (Alternative)

```bash
cd terraform
terraform init
terraform plan -var-file=environments/dev/terraform.tfvars
terraform apply -var-file=environments/dev/terraform.tfvars
```

---

## 📝 Environment Variables

```bash
# App
PORT=5000
NODE_ENV=development
APP_NAME=serviconnect

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=serviconnect
DB_USER=postgres
DB_PASS=your_password

# Security
JWT_SECRET=replace_with_long_random_string_min_32_chars
JWT_EXPIRE=7d

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=       # Use IAM role in production
AWS_SECRET_ACCESS_KEY=   # Use IAM role in production
SMS_ENABLED=true

# AI
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Frontend
FRONTEND_URL=http://localhost:5000
```

---

## 🧪 Testing

```bash
cd backend
npm test                 # Run all tests with coverage
npx jest --watch         # Watch mode
npx jest tests/auth.test.js  # Single file
```

### CI/CD Pipelines (GitHub Actions)

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `backend-ci.yml` | Push/PR | Lint, test, build Docker image |
| `frontend-ci.yml` | Push/PR | HTML/CSS validation |
| `db-check.yml` | Push/PR | Migration integrity check |
| `security-scan.yml` | Push/PR | npm audit vulnerability scan |
| `terraform-plan.yml` | PR | Terraform plan output |

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [BEGINNER_DEPLOYMENT_GUIDE.md](./docs/BEGINNER_DEPLOYMENT_GUIDE.md) | AWS deployment for beginners |
| [EC2_DEPLOYMENT_GUIDE.md](./docs/EC2_DEPLOYMENT_GUIDE.md) | Single EC2 instance setup |
| [DEPLOYMENT_GUIDE_CLOUDFORMATION.md](./docs/DEPLOYMENT_GUIDE_CLOUDFORMATION.md) | CloudFormation deployment |
| [DEPLOYMENT_GUIDE_TERRAFORM.md](./docs/DEPLOYMENT_GUIDE_TERRAFORM.md) | Terraform deployment |
| [GITHUB_WORKFLOW.md](./docs/GITHUB_WORKFLOW.md) | CI/CD pipeline details |
| [TEAM_ROLES.md](./docs/TEAM_ROLES.md) | Team roles & responsibilities |
| [ai-features.md](./docs/ai-features.md) | AI feature documentation |
| [iam-roles.md](./docs/iam-roles.md) | AWS IAM configuration |

---

## 🔮 Roadmap

- [ ] Google Maps integration (enhanced routing)
- [ ] Push notifications (Firebase FCM)
- [ ] In-app payments (Razorpay / Stripe)
- [ ] Regional language support (Telugu, Hindi, Tamil)
- [ ] React Native mobile app
- [ ] Referral & loyalty rewards system
- [ ] Worker earnings analytics dashboard
- [ ] Customer subscription plans

---

## 👥 Team

| Role | Contributor |
|------|------------|
| Full Stack Developer | Gowtham Kota |

---

## ⚠️ Security Notice

- **Never commit** `.env`, `*.pem`, or AWS credentials (covered by `.gitignore`)
- Production secrets managed via **AWS Secrets Manager**
- Aadhaar documents stored in **private uploads/** directory
- All API routes are rate-limited, validated, and JWT-protected
- Docker runs as **non-root user** (`appuser`)

---

## 📄 License

MIT © 2025 ServiConnect | Smart Local On-Demand Services Platform

---

<p align="center">
  Built with ❤️ using Node.js, PostgreSQL, AWS, and Socket.io<br>
  <a href="https://serviconnect.me">serviconnect.me</a>
</p>
