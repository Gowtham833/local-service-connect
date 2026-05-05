#!/bin/bash
# ─────────────────────────────────────────────────────────────
# ServiConnect — Frontend S3 Deploy Script
# All values read from environment variables (no hardcoding).
# ─────────────────────────────────────────────────────────────
set -e

: "${S3_BUCKET:?Required: S3_BUCKET}"
: "${CF_DIST_ID:?Required: CF_DIST_ID}"
: "${BACKEND_API_URL:?Required: BACKEND_API_URL}"
: "${AWS_REGION:?Required: AWS_REGION}"

COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:-}"
COGNITO_CLIENT_ID="${COGNITO_CLIENT_ID:-}"

echo "========================================"
echo " ServiConnect Frontend Deploy"
echo "========================================"
echo " Bucket : $S3_BUCKET"
echo " CF Dist: $CF_DIST_ID"
echo " API URL: $BACKEND_API_URL"

# 1. Generate runtime config.js (inject env vars into frontend)
echo "[1/4] Generating config.js..."
cat > frontend/public/js/config.js << EOF
window.__SERVICONNECT_CONFIG__ = {
  API_BASE_URL: '${BACKEND_API_URL}',
  COGNITO_USER_POOL_ID: '${COGNITO_USER_POOL_ID}',
  COGNITO_CLIENT_ID: '${COGNITO_CLIENT_ID}',
  AWS_REGION: '${AWS_REGION}'
};
EOF

# 2. Sync static assets with long cache
echo "[2/4] Syncing static assets (CSS, JS, images)..."
aws s3 sync frontend/public/ s3://$S3_BUCKET/ \
  --delete \
  --cache-control "max-age=86400, public" \
  --exclude "*.html" \
  --exclude "js/config.js" \
  --region $AWS_REGION

# 3. Sync HTML + config.js with no-cache
echo "[3/4] Syncing HTML and config.js (no-cache)..."
aws s3 sync frontend/public/ s3://$S3_BUCKET/ \
  --cache-control "no-cache, no-store, must-revalidate" \
  --include "*.html" \
  --region $AWS_REGION

aws s3 cp frontend/public/js/config.js s3://$S3_BUCKET/js/config.js \
  --cache-control "no-cache, no-store, must-revalidate" \
  --region $AWS_REGION

# 4. Invalidate CloudFront
echo "[4/4] Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CF_DIST_ID \
  --paths "/*"

echo "========================================"
echo " Frontend deployed successfully!"
echo " URL: https://$(aws cloudfront get-distribution --id $CF_DIST_ID --query 'Distribution.DomainName' --output text)"
echo "========================================"
