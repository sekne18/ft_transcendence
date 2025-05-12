# Makefile for managing the backend, NGINX, and other services with Docker

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_FLAGS = -f docker-compose.yml
BUILD = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_FLAGS) build
UP = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_FLAGS) up
DOWN = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_FLAGS) down
RESTART = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_FLAGS) restart
LOGS = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_FLAGS) logs
EXEC = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_FLAGS) exec

# Default target
.PHONY: all
all: build up

# Build the Docker containers
.PHONY: build
build:
	chmod +x ./backend/keygen.sh && ./keygen.sh
	@echo "Building frontend..."
	npm run build --prefix frontend
	@echo "Building backend..."
	npm run build --prefix backend
	@echo "Building Docker containers..."
	$(BUILD)

# Start the containers
.PHONY: up
up:
	@echo "Starting Docker containers..."
	$(UP)

# Stop the containers
.PHONY: down
down:
	@echo "Stopping Docker containers..."
	$(DOWN)

# Restart the containers
.PHONY: restart
restart:
	@echo "Restarting Docker containers..."
	$(RESTART)

# Show the logs for the services
.PHONY: logs
logs:
	@echo "Displaying logs..."
	$(LOGS) -f

# Exec into the backend container
.PHONY: backend-shell
backend-shell:
	@echo "Entering the backend container..."
	$(EXEC) backend sh

# Exec into the nginx container
.PHONY: nginx-shell
nginx-shell:
	@echo "Entering the nginx container..."
	$(EXEC) nginx sh
