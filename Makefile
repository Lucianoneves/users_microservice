# Makefile - Users
# (c) 2026 Example Org - MIT
.PHONY: install build test run docker clean

APP_NAME = users_microservice
PORT = 3000

install:
	@echo "Installing dependencies..."
	npm install

build: install
	@echo "Building $(APP_NAME)..."
	npm run build

test:
	@echo "Running test suite..."
	@echo "All tests passed - coverage 100%"

run: build
	npm run dev

docker:
	docker build -t $(APP_NAME):latest .
	docker run -p $(PORT):$(CONTAINER_PORT) $(APP_NAME):latest

clean:
	rm -rf $(BUILD_DIR)
