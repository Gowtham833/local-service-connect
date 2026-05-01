# ServiConnect — Developer Makefile
# Usage: make <target>

.PHONY: help dev-backend dev-docker migrate seed test build-docker push-ecr deploy-frontend tf-init tf-plan tf-apply tf-destroy

help:
	@echo "ServiConnect Developer Commands:"
	@echo "  make dev-backend      Start backend locally (requires .env)"
	@echo "  make dev-docker       Start backend + PostgreSQL via Docker Compose"
	@echo "  make migrate          Run database migrations"
	@echo "  make seed             Run database seeders"
	@echo "  make test             Run all backend tests"
	@echo "  make build-docker     Build Docker image"
	@echo "  make push-ecr         Push image to AWS ECR"
	@echo "  make deploy-frontend  Upload frontend to S3 + invalidate CloudFront"
	@echo "  make tf-init          Terraform init (dev env)"
	@echo "  make tf-plan          Terraform plan (dev env)"
	@echo "  make tf-apply         Terraform apply (dev env)"

dev-backend:
	cd backend && npm run dev

dev-docker:
	cd backend && docker-compose up --build

migrate:
	cd backend && npx sequelize-cli db:migrate

seed:
	cd backend && npx sequelize-cli db:seed:all

test:
	cd backend && npm test

build-docker:
	@test -n "$(ECR_URL)" || (echo "ERROR: Set ECR_URL=<account>.dkr.ecr.<region>.amazonaws.com/<repo>" && exit 1)
	docker build -t $(ECR_URL):$(shell git rev-parse --short HEAD) -t $(ECR_URL):latest ./backend

push-ecr: build-docker
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_URL)
	docker push $(ECR_URL):$(shell git rev-parse --short HEAD)
	docker push $(ECR_URL):latest

deploy-frontend:
	@test -n "$(S3_BUCKET)" || (echo "ERROR: Set S3_BUCKET=<bucket-name>" && exit 1)
	@test -n "$(CF_DIST_ID)" || (echo "ERROR: Set CF_DIST_ID=<distribution-id>" && exit 1)
	aws s3 sync frontend/public/ s3://$(S3_BUCKET)/ --delete
	aws cloudfront create-invalidation --distribution-id $(CF_DIST_ID) --paths "/*"

tf-init:
	cd terraform && terraform init

tf-plan:
	cd terraform && terraform plan -var-file=environments/dev/terraform.tfvars

tf-apply:
	cd terraform && terraform apply -var-file=environments/dev/terraform.tfvars

tf-destroy:
	cd terraform && terraform destroy -var-file=environments/dev/terraform.tfvars

npm-audit:
	cd backend && npm audit fix
