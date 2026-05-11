# ServiConnect 🔧

> **Smart Local On-Demand Services Platform**  
> *Right Worker. Right Time. Right at Your Door.*

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-v4.18-black?logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15-blue?logo=postgresql)](https://postgresql.org)
[![AWS](https://img.shields.io/badge/AWS-CloudFormation-orange?logo=amazonaws)](https://aws.amazon.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.8-white?logo=socket.io)](https://socket.io)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

---

## 🌟 What is ServiConnect?

ServiConnect is a **production-grade, full-stack platform** that connects local customers with verified on-demand service workers (plumbers, electricians, carpenters, cleaners, etc.) in real time. It features:

- 📱 **OTP-based authentication** via AWS SNS (real SMS delivery)
- 🗺️ **Real-time worker tracking** with OpenStreetMap + Socket.io
- 🤖 **AI-powered features** — smart worker matching, price estimation, sentiment analysis, and an intelligent chatbot — all via AWS Bedrock (Claude 3 Haiku)
- 🔐 **Aadhaar identity verification** with secure document upload
- ☁️ **Enterprise AWS deployment** using CloudFormation (VPC, ECS Fargate, RDS, ALB, S3, CloudFront, Secrets Manager)

---

## 📁 Project Structure

```
servi-connect/
├── backend/                          ← Node.js + Express API Server (v2.0)
│   ├── server.js                     ← Entry point — Express + Socket.io + SQS worker
│   ├── package.json
│   ├── Dockerfile                    ← Docker container for ECS Fargate
│   ├── docker-compose.yml            ← Local dev (API + PostgreSQL)
│   ├── .env.example                  ← Copy to .env and fill values
│   ├── config/
│   │   ├── aws.js                    ← Loads config from AWS Secrets Manager / .env
│   │   └── database.js               ← Sequelize connection factory
│   ├── middleware/
│   │   ├── auth.js                   ← JWT protect + role-based authorize helpers
│   │   ├── security.js               ← Helmet, CORS, rate limiting
│   │   └── errorHandler.js           ← Global error handler
│   ├── models/
│   │   ├── Customer.js               ← Sequelize model: customers table
│   │   ├── Worker.js                 ← Sequelize model: workers table (Aadhaar, skills)
│   │   ├── Booking.js                ← Sequelize model: bookings + status workflow
│   │   ├── Review.js                 ← Sequelize model: ratings & reviews
│   │   ├── PasswordResetToken.js     ← OTP password reset tokens
│   │   └── index.js                  ← Model associations + sequelize init
│   ├── routes/
│   │   ├── auth.js                   ← POST /api/auth/* — register, login, OTP, reset
│   │   ├── customer.js               ← GET/POST /api/customer/*
│   │   ├── worker.js                 ← GET/PATCH /api/worker/*
│   │   ├── ai.js                     ← POST /api/ai/* — chatbot, matching, pricing
│   │   └── admin.js                  ← GET/PATCH /api/admin/* — admin panel APIs
│   ├── services/
│   │   ├── smsService.js             ← AWS SNS — sends OTP SMS to real phones
│   │   ├── uploadService.js          ← AWS S3 — Aadhaar + selfie document uploads
│   │   ├── socketService.js          ← Socket.io — real-time location updates
│   │   ├── sqsService.js             ← AWS SQS — async job queue
│   │   ├── chatbotService.js         ← AWS Bedrock Claude — AI chat support
│   │   ├── workerMatchingAI.js       ← AWS Bedrock — intelligent worker recommendation
│   │   ├── priceEstimationAI.js      ← AWS Bedrock — dynamic price estimation
│   │   ├── reviewSentimentService.js ← AWS Comprehend — review sentiment analysis
│   │   └── bedrockService.js         ← AWS Bedrock base client
│   ├── workers/
│   │   └── dbWorker.js               ← SQS consumer — async background DB operations
│   ├── migrations/                   ← Sequelize migration files
│   └── tests/                        ← Jest unit + integration tests
│
├── frontend/
│   └── public/                       ← Served as static files by Express
│       ├── index.html                ← Landing page (glassmorphism violet theme)
│       ├── css/
│       │   └── shared.css            ← Premium dark glassmorphism UI styles
│       ├── js/
│       │   └── api.js                ← Auth helpers + Axios API client
│       └── pages/
│           ├── customer-login.html   ← Customer login + OTP signup
│           ├── customer-dashboard.html ← Customer dashboard: book, track, rate
│           ├── worker-login.html     ← Worker login + Aadhaar registration
│           ├── worker-dashboard.html ← Worker dashboard: jobs, map, earnings
│           ├── admin-login.html      ← Admin login
│           └── admin-dashboard.html  ← Admin panel: manage workers & bookings
│
├── cloudformation/                   ← AWS Infrastructure as Code
│   ├── single-click-deploy.yaml      ← ⭐ One-click full-stack AWS deployment
│   ├── ec2-single-click.yaml         ← Simplified EC2 deploy (for beginners)
│   ├── master.yaml                   ← Nested stack orchestrator
│   ├── templates/
│   │   ├── vpc.yaml                  ← VPC, subnets, security groups
│   │   ├── rds.yaml                  ← PostgreSQL RDS (Multi-AZ)
│   │   ├── ecs.yaml                  ← ECS Fargate cluster + service
│   │   ├── s3-cloudfront.yaml        ← S3 bucket + CloudFront CDN
│   │   └── iam.yaml                  ← IAM roles and policies
│   └── parameters/
│       ├── prod.json                 ← Production stack parameters
│       └── dev.json                  ← Development stack parameters
│
├── docs/                             ← Deployment guides
│   ├── BEGINNER_DEPLOYMENT_GUIDE.md  ← Step-by-step for AWS beginners
│   ├── DEPLOYMENT_GUIDE_GUI.md       ← AWS Console GUI deployment
│   ├── DEPLOYMENT_GUIDE_CLOUDFORMATION.md
│   ├── EC2_DEPLOYMENT_GUIDE.md
│   ├── GITHUB_WORKFLOW.md
│   ├── TEAM_ROLES.md
│   └── ai-features.md               ← AI feature documentation
│
├── migrations/                       ← Root-level DB migration scripts
├── seeders/                          ← Database seed data
├── scripts/                          ← Utility / CI scripts
├── nginx.conf                        ← Nginx reverse proxy config (EC2)
├── Makefile                          ← Common dev commands
└── .gitignore
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| PostgreSQL | v14+ | [postgresql.org](https://www.postgresql.org/download/) |
| Git | any | [git-scm.com](https://git-scm.com) |

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Gowtham833/local-service-connect.git
cd local-service-connect
```

### Step 2 — Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# App
PORT=5000
NODE_ENV=development

# PostgreSQL (local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=serviconnect
DB_USER=postgres
DB_PASS=your_postgres_password

# JWT
JWT_SECRET=your_random_secret_min_32_chars
JWT_EXPIRE=7d

# AWS (for OTP SMS and AI features — optional for basic local dev)
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_key        ← Only for local dev; use IAM roles in production
# AWS_SECRET_ACCESS_KEY=your_secret

# AWS SNS (OTP SMS delivery)
# Configure in AWS Console → SNS

# AWS Bedrock AI
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Frontend URL
FRONTEND_URL=http://localhost:5000
```

### Step 3 — Set Up the Database

```bash
# Create the database in PostgreSQL
psql -U postgres -c "CREATE DATABASE serviconnect;"

# Run migrations
npm run migrate

# (Optional) Seed sample data
npm run seed
```

### Step 4 — Install Dependencies & Start Server

```bash
# Install dependencies
npm install

# Development mode (auto-restart on file changes)
npm run dev

# OR production mode (runs migrations first)
npm start
```

You should see:
```
╔══════════════════════════════════════════╗
║      ServiConnect API Server v2.0        ║
║      Running on http://localhost:5000    ║
║      Environment: development            ║
╚══════════════════════════════════════════╝
[DB] PostgreSQL connection established
[DB] Models synced (development mode)
[SQS] DB worker started
```

### Step 5 — Open the App

```
http://localhost:5000
```

The Express server serves both the REST API and all frontend pages.

---

## 🐳 Docker Compose (Recommended for Local Dev)

Run the full stack (API + PostgreSQL) with a single command:

```bash
cd backend
docker-compose up --build
```

This starts:
- `serviconnect-api` on port `5000`
- `serviconnect-db` PostgreSQL on port `5432`

---

## 🔗 URL Reference

| URL | Page | Auth Required |
|-----|------|:---:|
| `http://localhost:5000/` | 🏠 Landing page | No |
| `http://localhost:5000/pages/customer-login.html` | 👤 Customer login / OTP signup | No |
| `http://localhost:5000/pages/customer-dashboard.html` | 📋 Customer dashboard | ✅ Customer |
| `http://localhost:5000/pages/worker-login.html` | 🔧 Worker login / Aadhaar registration | No |
| `http://localhost:5000/pages/worker-dashboard.html` | 🗺️ Worker dashboard | ✅ Worker |
| `http://localhost:5000/pages/admin-login.html` | 🛡️ Admin login | No |
| `http://localhost:5000/pages/admin-dashboard.html` | ⚙️ Admin panel | ✅ Admin |
| `http://localhost:5000/api/health` | 💚 API health check | No |

---

## 🔌 API Reference

### Authentication (`/api/auth`) — Public

```
POST /api/auth/customer/register     — Register new customer account
POST /api/auth/customer/login        — Customer login → returns JWT token
POST /api/auth/customer/send-otp     — Send OTP via AWS SNS SMS
POST /api/auth/customer/verify-otp   — Verify OTP → returns JWT token
POST /api/auth/customer/forgot-password — Send password reset OTP
POST /api/auth/customer/reset-password  — Reset password with OTP

POST /api/auth/worker/register       — Register worker (with Aadhaar upload)
POST /api/auth/worker/login          — Worker login → returns JWT token
POST /api/auth/worker/send-otp       — Send OTP via AWS SNS SMS
POST /api/auth/worker/verify-otp     — Verify OTP → returns JWT token
POST /api/auth/worker/forgot-password
POST /api/auth/worker/reset-password
```

### Customer Routes (`/api/customer`) — Bearer Token: `customer`

```
GET  /api/customer/me                — Profile + stats + recent bookings
GET  /api/customer/workers           — Browse available workers (?service=Plumbing&city=Hyderabad)
GET  /api/customer/bookings          — All bookings
POST /api/customer/bookings          — Post new service request
PATCH /api/customer/bookings/:id/rate — Rate a completed booking (1–5 stars + review)
POST /api/customer/contact-worker/:id — Get worker contact info (after booking)
```

### Worker Routes (`/api/worker`) — Bearer Token: `worker`

```
GET   /api/worker/me                 — Profile + stats + job history
PATCH /api/worker/availability       — Toggle online/offline { isAvailable: true/false }
PATCH /api/worker/location           — Update GPS location { lat, lng }
GET   /api/worker/open-jobs          — Available jobs matching worker's skills
PATCH /api/worker/jobs/:id/accept    — Accept an open job
PATCH /api/worker/jobs/:id/complete  — Mark job complete + set price { price: 850 }
```

### AI Routes (`/api/ai`) — Bearer Token: any

```
POST /api/ai/chat                    — AI chatbot (AWS Bedrock Claude 3 Haiku)
POST /api/ai/match-workers           — AI worker recommendation for a service
POST /api/ai/estimate-price          — AI price estimation for a job
POST /api/ai/analyze-review          — AWS Comprehend sentiment analysis
```

### Admin Routes (`/api/admin`) — Bearer Token: `admin`

```
GET   /api/admin/dashboard           — Platform-wide stats
GET   /api/admin/workers             — All workers (with verification status)
PATCH /api/admin/workers/:id/verify  — Approve / reject worker Aadhaar verification
GET   /api/admin/bookings            — All bookings with filters
GET   /api/admin/customers           — All registered customers
```

---

## 🧠 AI Features (AWS Bedrock)

ServiConnect integrates **AWS Bedrock (Claude 3 Haiku)** and **AWS Comprehend** for intelligent automation:

| Feature | Service | Description |
|---------|---------|-------------|
| 🤖 AI Chatbot | Bedrock Claude 3 Haiku | 24/7 customer support, booking help, FAQ |
| 🎯 Smart Worker Matching | Bedrock Claude 3 Haiku | Recommends best workers by rating, proximity, and skills |
| 💰 Price Estimation | Bedrock Claude 3 Haiku | Dynamic job pricing based on service type, duration, and location |
| 😊 Sentiment Analysis | AWS Comprehend | Analyses customer reviews to flag negative experiences |

> Configure AI via `BEDROCK_REGION` and `BEDROCK_MODEL_ID` in `.env`. AWS Bedrock models are enabled by default upon first invocation in your region.

---

## 🗺️ Real-Time Features (Socket.io)

ServiConnect uses **Socket.io v4** for live bidirectional communication:

- 📍 **Live Worker Location** — Worker GPS coordinates streamed to customer's map (OpenStreetMap + Leaflet.js)
- 🔔 **Job Notifications** — Workers receive instant job alerts when customers post requests
- 📊 **Status Updates** — Booking status changes (accepted → en route → completed) pushed live
- 💬 **In-App Messaging** — Real-time communication between customers and workers

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT (jsonwebtoken v9) |
| Password Hashing | bcryptjs (salt rounds: 12) |
| OTP Delivery | AWS SNS (real SMS, 6-digit, 5-min expiry) |
| Rate Limiting | express-rate-limit (100 req/15min) |
| HTTP Security | Helmet.js (CSP, HSTS, XSS protection) |
| Identity Verification | Aadhaar card upload → AWS S3 → Admin review |
| Secrets Management | AWS Secrets Manager + Parameter Store (production) |
| Input Validation | express-validator on all routes |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js v18+ | JavaScript server runtime |
| **Framework** | Express v4.18 | REST API server |
| **Database** | PostgreSQL v15 + Sequelize v6 | Relational data + ORM |
| **Real-time** | Socket.io v4.8 | Live tracking & notifications |
| **Auth** | JWT + bcryptjs | Stateless authentication |
| **OTP/SMS** | AWS SNS | Real phone number OTP delivery |
| **File Storage** | AWS S3 + Multer | Aadhaar & document uploads |
| **AI/ML** | AWS Bedrock (Claude 3 Haiku) | Chatbot, matching, pricing |
| **Sentiment** | AWS Comprehend | Review analysis |
| **Queue** | AWS SQS | Async background job processing |
| **Email** | AWS SES | Transactional emails |
| **Maps** | OpenStreetMap + Leaflet.js | Free real-time mapping |
| **Frontend** | Vanilla HTML + CSS + JS | Glassmorphism violet-theme UI |
| **Fonts** | Google Fonts (Syne + DM Sans) | Premium typography |
| **Security** | Helmet + express-rate-limit | HTTP hardening |
| **Container** | Docker + Docker Compose | Local dev & production container |
| **IaC** | AWS CloudFormation | Infrastructure as Code |
| **Proxy** | Nginx | Reverse proxy (EC2 deployments) |
| **Testing** | Jest + Supertest | Unit & integration tests |

---

## ☁️ AWS Deployment

ServiConnect ships with **production-ready AWS CloudFormation templates** for enterprise-scale deployment.

### Architecture

```
Internet
    │
    ▼
CloudFront CDN (frontend static files from S3)
    │
    ▼
Application Load Balancer (HTTPS)
    │
    ▼
ECS Fargate Cluster (Docker containers — auto-scaling)
    │
    ├── AWS Secrets Manager  (DB credentials, JWT secret)
    ├── AWS Parameter Store  (app config, URLs)
    ├── AWS SNS              (OTP SMS delivery)
    ├── AWS SQS              (async job queue)
    ├── AWS S3               (Aadhaar + document storage)
    ├── AWS Bedrock          (Claude 3 Haiku AI features)
    └── AWS Comprehend       (review sentiment analysis)
    │
    ▼
RDS PostgreSQL (Multi-AZ, encrypted)
    (inside private subnets of VPC)
```

### Option A — Single-Click CloudFormation (Recommended)

> 📖 See **[BEGINNER_DEPLOYMENT_GUIDE.md](./docs/BEGINNER_DEPLOYMENT_GUIDE.md)** for a complete step-by-step walkthrough.

1. Go to [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation)
2. Click **Create Stack → With new resources**
3. Upload `cloudformation/single-click-deploy.yaml`
4. Fill in parameters (DB password, domain, AWS region)
5. Click **Create Stack** — AWS provisions everything automatically (~15 min)

**What gets deployed:**
- VPC with public + private subnets across 2 AZs
- ECS Fargate cluster running the Node.js Docker container
- RDS PostgreSQL (Multi-AZ, encrypted at rest)
- Application Load Balancer with HTTPS (ACM certificate)
- S3 bucket + CloudFront CDN for frontend
- Secrets Manager storing DB credentials and JWT secret
- SQS queue for async processing
- IAM roles with least-privilege permissions

### Option B — EC2 Single-Click (Simpler)

```bash
# Upload ec2-single-click.yaml in CloudFormation Console
# This deploys a single EC2 instance with Docker + Nginx
```

> 📖 See [EC2_DEPLOYMENT_GUIDE.md](./docs/EC2_DEPLOYMENT_GUIDE.md)

### Option C — Docker on Any VPS

```bash
git clone https://github.com/Gowtham833/local-service-connect.git
cd local-service-connect/backend

# Build and run container
docker build -t serviconnect .
docker run -d \
  --name serviconnect \
  -p 5000:5000 \
  --env-file .env \
  serviconnect

# Or with docker-compose (includes PostgreSQL)
docker-compose up -d
```

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests with coverage report
npm test

# Watch mode during development
npx jest --watch
```

Tests are located in `backend/tests/` and use **Jest + Supertest** for HTTP integration testing.

---

## 📝 Database Migrations

```bash
cd backend

# Run all pending migrations
npm run migrate

# Seed the database with sample data
npm run seed

# Roll back all migrations (⚠️ destructive)
npm run migrate:undo
```

---

## 🔧 Makefile Commands

```bash
make install     # Install backend dependencies
make dev         # Start development server
make migrate     # Run database migrations
make seed        # Seed sample data
make test        # Run test suite
make docker-up   # Start with Docker Compose
make docker-down # Stop Docker containers
```

---

## 📱 Features Overview

### Customer Features
- ✅ OTP-based phone number registration (real SMS via AWS SNS)
- ✅ Browse verified workers by service type and city
- ✅ Book a service with preferred date/time
- ✅ Real-time worker location tracking on OpenStreetMap
- ✅ View worker contact details after booking confirmation
- ✅ Rate and review completed jobs
- ✅ Self-service password reset via OTP
- ✅ AI chatbot for booking help and support
- ✅ AI-powered price estimation before booking

### Worker Features
- ✅ OTP-based phone registration with Aadhaar identity verification
- ✅ Upload Aadhaar card (securely stored in AWS S3, reviewed by admin)
- ✅ Toggle online/offline availability
- ✅ Real-time job notifications via Socket.io
- ✅ Accept/decline open job requests
- ✅ Update GPS location (shared live with customers)
- ✅ Mark jobs as complete and set final price
- ✅ View earnings and job history

### Admin Features
- ✅ Platform dashboard with real-time stats
- ✅ Verify / reject worker Aadhaar documents
- ✅ View and manage all bookings
- ✅ Monitor all customers and workers

---

## 🗂️ Environment Variables Reference

| Variable | Required | Description |
|----------|:--------:|-------------|
| `PORT` | ✅ | Server port (default: 5000) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `DB_HOST` | ✅ | PostgreSQL host |
| `DB_PORT` | ✅ | PostgreSQL port (default: 5432) |
| `DB_NAME` | ✅ | Database name |
| `DB_USER` | ✅ | Database user |
| `DB_PASS` | ✅ | Database password |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `JWT_EXPIRE` | ✅ | Token expiry (e.g. `7d`) |
| `AWS_REGION` | ✅ | AWS region (e.g. `us-east-1`) |
| `BEDROCK_MODEL_ID` | ⚙️ | Claude model ID for AI features |
| `SES_FROM_EMAIL` | ⚙️ | Verified SES sender email |
| `FRONTEND_URL` | ⚙️ | Frontend base URL (for CORS) |
| `COGNITO_USER_POOL_ID` | ⚙️ | AWS Cognito pool (optional) |

> In **production** on AWS, secrets are loaded automatically from **AWS Secrets Manager** and **Parameter Store** — you do not set them as environment variables.

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [BEGINNER_DEPLOYMENT_GUIDE.md](./docs/BEGINNER_DEPLOYMENT_GUIDE.md) | AWS deployment for beginners (step-by-step with screenshots) |
| [DEPLOYMENT_GUIDE_GUI.md](./docs/DEPLOYMENT_GUIDE_GUI.md) | CloudFormation GUI deployment walkthrough |
| [EC2_DEPLOYMENT_GUIDE.md](./docs/EC2_DEPLOYMENT_GUIDE.md) | Single EC2 instance deployment |
| [GITHUB_WORKFLOW.md](./docs/GITHUB_WORKFLOW.md) | CI/CD pipeline and GitHub Actions |
| [TEAM_ROLES.md](./docs/TEAM_ROLES.md) | Team roles and responsibilities |
| [ai-features.md](./docs/ai-features.md) | AI feature integration details |
| [Project_Tech_Stack_Explained.md](./Project_Tech_Stack_Explained.md) | Full tech stack explanation |

---

## 🔮 Roadmap

- [ ] Google Maps integration (enhanced routing + traffic)
- [ ] Push notifications (Firebase FCM)
- [ ] In-app payments (Razorpay / Stripe)
- [ ] Regional language support (Telugu, Hindi via Sarvam AI)
- [ ] Mobile app (React Native)
- [ ] Referral and loyalty rewards system
- [ ] Worker background check integration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

See [GITHUB_WORKFLOW.md](./docs/GITHUB_WORKFLOW.md) for the full contribution guide.

---

## ⚠️ Security Notice

- **Never commit `.env` or `*.pem` files** to the repository (`.gitignore` covers this)
- In production, all secrets are managed via **AWS Secrets Manager** — no plaintext credentials
- Aadhaar documents are stored in a **private S3 bucket** with no public access
- All API routes are rate-limited and validated with `express-validator`

---

## 📄 License

MIT © 2025 ServiConnect | Smart Local On-Demand Services Platform

---

*Built with ❤️ using Node.js, PostgreSQL, AWS, and Socket.io*
