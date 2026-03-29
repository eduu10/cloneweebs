# CloneWeebs AI — Makefile
# All commands run via Docker Compose — zero setup needed

.PHONY: dev stop clean build test lint migrate seed logs health

# ==================== DEVELOPMENT ====================
dev:
	docker compose up -d
	@echo "✅ CloneWeebs running!"
	@echo "   🌐 Web:      http://localhost:3000"
	@echo "   🔌 API:      http://localhost:8000"
	@echo "   📊 API Docs: http://localhost:8000/docs"
	@echo "   🗄️  MinIO:    http://localhost:9001"
	@echo "   🐘 Postgres: localhost:5432"
	@echo "   🔴 Redis:    localhost:6379"

stop:
	docker compose down

clean:
	docker compose down -v --remove-orphans
	@echo "✅ All containers and volumes removed"

restart:
	docker compose restart

# ==================== BUILD ====================
build:
	docker compose build --no-cache

# ==================== DATABASE ====================
migrate:
	docker compose exec api alembic upgrade head

migrate-create:
	docker compose exec api alembic revision --autogenerate -m "$(msg)"

migrate-rollback:
	docker compose exec api alembic downgrade -1

seed:
	docker compose exec api python -m src.seeds.run

# ==================== TESTING ====================
test-api:
	docker compose exec api pytest tests/ -v --cov=src --cov-report=term-missing

test-web:
	docker compose exec web npm run test

test: test-api test-web

# ==================== LINTING ====================
lint-api:
	docker compose exec api ruff check src/
	docker compose exec api mypy src/

lint-web:
	docker compose exec web npm run lint
	docker compose exec web npx tsc --noEmit

lint: lint-api lint-web

# ==================== LOGS ====================
logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

logs-web:
	docker compose logs -f web

logs-worker:
	docker compose logs -f worker

# ==================== HEALTH ====================
health:
	@curl -s http://localhost:8000/health | python -m json.tool 2>/dev/null || echo "❌ API not running"
	@curl -s http://localhost:3000 > /dev/null 2>&1 && echo "✅ Web running" || echo "❌ Web not running"

# ==================== SHELL ====================
shell-api:
	docker compose exec api bash

shell-db:
	docker compose exec postgres psql -U cloneweebs -d cloneweebs

shell-redis:
	docker compose exec redis redis-cli
