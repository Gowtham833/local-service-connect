#!/bin/bash
# ─────────────────────────────────────────────────────────────
# ServiConnect — Database Migration Script (Production)
# Run this after deploying a new version to AWS ECS.
# All credentials are read from environment (never hardcoded).
# ─────────────────────────────────────────────────────────────
set -e

echo "========================================"
echo " ServiConnect DB Migration Runner"
echo "========================================"

# Validate required env vars
: "${DB_HOST:?Required: DB_HOST}"
: "${DB_NAME:?Required: DB_NAME}"
: "${DB_USER:?Required: DB_USER}"
: "${DB_PASS:?Required: DB_PASS}"

echo "[1/3] Running database migrations..."
NODE_ENV=production npx sequelize-cli db:migrate

echo "[2/3] Running seeders (skip if already seeded)..."
NODE_ENV=production npx sequelize-cli db:seed:all || echo "Seeders already applied — skipping"

echo "[3/3] Migration complete!"
echo "========================================"
