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
	@echo "Generating keys..."
	mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/selfsigned.key \
		-out nginx/ssl/selfsigned.crt \
		-subj "/C=BE/L=Antwerp/O=c19/CN=pongy.com"
	@echo "Generating JWT keys..."
	cd backend && chmod +x ./keygen.sh && ./keygen.sh && cd ..
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

.PHONY: clean
clean:
	@echo "Cleaning up..."
	$(DOWN) --rmi all

.PHONY: prune-all
prune-all:
	docker system prune -a --volumes -f