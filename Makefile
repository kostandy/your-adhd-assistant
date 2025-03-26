.PHONY: install dev bot-start bot-deploy worker-dev worker-deploy

install:
	npm install

dev:
	npm run dev

bot-dev:
	npm run dev

bot-deploy:
	npm run deploy

bot-start:
	npm run start

worker-dev:
	npm run worker:dev

worker-deploy:
	npm run worker:deploy

all: install bot-deploy worker-deploy