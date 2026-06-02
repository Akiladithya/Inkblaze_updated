.PHONY: help build up down logs ps clean restart test

help:
	@echo "PDF Highlighter - Docker Makefile"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Development targets:"
	@echo "  make dev-up         - Start development environment"
	@echo "  make dev-down       - Stop development environment"
	@echo "  make dev-logs       - View development logs"
	@echo ""
	@echo "Production targets:"
	@echo "  make prod-up        - Start production environment"
	@echo "  make prod-down      - Stop production environment"
	@echo "  make prod-logs      - View production logs"
	@echo ""
	@echo "General targets:"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services (standard compose)"
	@echo "  make down           - Stop all services"
	@echo "  make logs           - View logs"
	@echo "  make ps             - Show running containers"
	@echo "  make clean          - Remove stopped containers and unused volumes"
	@echo "  make restart        - Restart all services"
	@echo ""
	@echo "Ollama targets:"
	@echo "  make ollama-models  - List available Ollama models"
	@echo "  make ollama-pull    - Pull Mistral model (5GB)"
	@echo "  make ollama-pull-light - Pull orca-mini model (1GB)"
	@echo ""
	@echo "Backend targets:"
	@echo "  make backend-bash   - Shell into backend container"
	@echo "  make backend-test   - Run backend tests"
	@echo ""
	@echo "Frontend targets:"
	@echo "  make frontend-logs  - View frontend logs only"
	@echo ""

# Development
dev-up:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Development environment started"
	@echo "Backend: http://localhost:5000"
	@echo "Ollama: http://localhost:11434"
	@echo "Run 'npm start' in another terminal for frontend"

dev-down:
	docker-compose -f docker-compose.dev.yml down
	@echo "✅ Development environment stopped"

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-ps:
	docker-compose -f docker-compose.dev.yml ps

# Production
prod-up:
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production environment started"

prod-down:
	docker-compose -f docker-compose.prod.yml down
	@echo "✅ Production environment stopped"

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Standard
build:
	docker-compose build --no-cache
	@echo "✅ All images rebuilt"

up:
	docker-compose up -d
	@echo "✅ Services started"

down:
	docker-compose down
	@echo "✅ Services stopped"

ps:
	docker-compose ps

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-ollama:
	docker-compose logs -f ollama

logs-frontend:
	docker-compose logs -f frontend

clean:
	docker container prune -f
	docker volume prune -f
	@echo "✅ Cleanup complete"

restart:
	docker-compose restart
	@echo "✅ Services restarted"

# Ollama targets
ollama-models:
	docker-compose exec ollama ollama list

ollama-pull:
	docker-compose exec ollama ollama pull mistral
	@echo "✅ Mistral model (5GB) pulling... Check logs: make logs-ollama"

ollama-pull-light:
	docker-compose exec ollama ollama pull orca-mini
	@echo "✅ Orca-mini model (1GB) pulling... Check logs: make logs-ollama"

ollama-test:
	docker-compose exec ollama curl -s http://localhost:11434/api/tags | python -m json.tool

# Backend targets
backend-bash:
	docker-compose exec backend bash

backend-test:
	docker-compose exec backend pytest

backend-health:
	curl http://localhost:5000/health

# Frontend targets
frontend-bash:
	docker-compose exec frontend bash

frontend-logs:
	docker-compose logs -f frontend

# Database targets (if added)
db-shell:
	docker-compose exec db psql -U postgres

db-migrate:
	docker-compose exec backend flask db upgrade

# System targets
stats:
	docker stats

disk-usage:
	docker system df

full-clean:
	docker-compose down -v
	docker system prune -a --volumes -f
	@echo "✅ Full cleanup complete - all containers, volumes, and images removed"

# Shortcuts
h: help

# Aliases
dev: dev-up
prod: prod-up
off: down
status: ps
watch: logs
shell: backend-bash
health: backend-health
pull-model: ollama-pull
list-models: ollama-models

.DEFAULT_GOAL := help
