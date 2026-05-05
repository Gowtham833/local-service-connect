# AI Features in ServiConnect
# Powered by AWS Bedrock + Amazon Comprehend

## Overview

ServiConnect integrates 4 AI features, all running on AWS fully managed services — no AI servers to manage.

| Feature | Service | Endpoint | Model |
|---------|---------|----------|-------|
| Smart Worker Matching | AWS Bedrock Claude | `POST /api/ai/match-workers` | Claude 3 Haiku (dev) / Sonnet (prod) |
| AI Price Estimation | AWS Bedrock Claude | `GET /api/ai/price-estimate` | Claude 3 Haiku |
| Customer Support Chatbot | AWS Bedrock Claude | `POST /api/ai/chat` | Claude 3 Haiku |
| Review Sentiment Analysis | Amazon Comprehend | Auto (on review submit) | AWS managed |

---

## 1. Smart Worker Matching

**How it works:**
1. Customer posts a job (e.g., "My bathroom pipe is leaking under the sink")
2. Backend fetches all available + verified workers
3. Bedrock Claude ranks workers by: skill match, rating, experience
4. Top 5 matched worker IDs stored in `bookings.ai_matched_worker_ids`
5. Frontend shows ranked workers to customer

**API:**
```
POST /api/ai/match-workers
Authorization: Bearer <token>
Body: { "service": "Plumbing", "description": "Leaking pipe under sink", "city": "Hyderabad" }

Response:
{ "success": true, "count": 3, "data": [ { worker ranked #1 }, { #2 }, { #3 } ] }
```

---

## 2. AI Price Estimation

**How it works:**
- Customer provides service type + job description
- Claude estimates a fair price range in Indian Rupees (₹) based on Hyderabad/Indian metro rates
- Price is shown to customer BEFORE booking as a guide
- Stored as `bookings.ai_suggested_price`

**API:**
```
GET /api/ai/price-estimate?service=Plumbing&description=Leaking+pipe&city=Hyderabad
Authorization: Bearer <token>

Response:
{ "success": true, "data": { "min": 400, "max": 900, "suggested": 650, "reasoning": "Standard plumbing repair rate in Hyderabad" } }
```

---

## 3. ServiBot — Customer Support Chatbot

**How it works:**
- Floating chat widget on every page (bottom-right corner)
- Customer types a question → sent to `/api/ai/chat`
- Claude responds with helpful info about services, bookings, pricing
- Conversation history maintained client-side (last 6 messages sent for context)
- **No authentication required** — available before login too

**API:**
```
POST /api/ai/chat
Body: { "message": "How do I cancel a booking?", "history": [] }

Response:
{ "success": true, "reply": "To cancel a booking, go to My Bookings and click Cancel..." }
```

---

## 4. Review Sentiment Analysis

**How it works:**
- Customer submits a rating (1-5) + optional text comment
- Amazon Comprehend automatically detects sentiment: POSITIVE / NEGATIVE / NEUTRAL / MIXED
- Sentiment + confidence scores stored in `reviews.sentiment` and `reviews.sentiment_score`
- Useful for: admin dashboards, identifying unhappy customers, fraud detection

**Triggered automatically when:**
`PATCH /api/customer/bookings/:id/rate` is called

**Stored data:**
```json
{
  "sentiment": "POSITIVE",
  "sentimentScore": { "positive": 0.97, "negative": 0.01, "neutral": 0.02, "mixed": 0.0 }
}
```

---

## Environment Variables for AI Features

| Variable | Dev (.env) | Production (AWS) |
|----------|-----------|-----------------|
| `BEDROCK_REGION` | `us-east-1` | SSM: `/serviconnect/bedrock-region` |
| `BEDROCK_MODEL_ID` | `anthropic.claude-3-haiku-20240307-v1:0` | SSM: `/serviconnect/bedrock-model-id` |
| `AWS_REGION` | `us-east-1` | ECS task env var |

## IAM Permissions Required

The ECS Task Role must have:
```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel"],
  "Resource": "arn:aws:bedrock:us-east-1::foundation-model/*"
},
{
  "Effect": "Allow",
  "Action": ["comprehend:DetectSentiment"],
  "Resource": "*"
}
```
These are automatically created by `terraform/modules/iam/main.tf`.

## Enabling Bedrock Models in AWS Console

1. AWS Console → **Amazon Bedrock** → **Model access**
2. Click **"Modify model access"**
3. Enable: ✅ Claude 3 Haiku, ✅ Claude 3 Sonnet
4. Click **Submit** → Wait ~2 minutes for access to activate
