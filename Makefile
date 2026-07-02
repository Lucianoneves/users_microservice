# Makefile - Users microservice monorepo
.PHONY: install build test run docker clean

APP_NAME = users_microservice
PORT = 3000

install:
	@echo "Installing backend dependencies..."
	npm install --prefix backend
	@echo "Installing frontend dependencies..."
	npm install --prefix frontend

build: install
	@echo "Building backend..."
	npm run build --prefix backend

test:
	npm run test --prefix backend

run:
	npm run dev --prefix backend

docker:
	docker build -t $(APP_NAME):latest ./backend
	docker run -p $(PORT):3000 $(APP_NAME):latest

clean:
	rm -rf backend/dist backend/coverage frontend/dist
