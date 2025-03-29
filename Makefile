.PHONY: install dev bot-start bot-deploy worker-dev worker-deploy docker-build docker-push deploy

install:
	npm install

dev:
	npm run dev

bot-start:
	npm run start

bot-deploy:
	npm run commands:deploy

worker-dev:
	npm run worker:dev

worker-deploy:
	npm run worker:deploy

# Docker commands
docker-build:
	docker build -t adhd-discord-bot:latest .

docker-push: docker-build
	docker tag adhd-discord-bot:latest $(OCI_REGION).ocir.io/$(OCI_NAMESPACE)/$(OCI_IMAGE_NAME):$(OCI_IMAGE_TAG)
	docker push $(OCI_REGION).ocir.io/$(OCI_NAMESPACE)/$(OCI_IMAGE_NAME):$(OCI_IMAGE_TAG)

# Full deployment
deploy: docker-build docker-push
	@echo "Docker image built and pushed to Oracle Container Registry"
	@echo "Use GitHub Actions to deploy to Oracle VM"

all: install bot-deploy worker-deploy