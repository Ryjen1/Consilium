.PHONY: install dev dev-backend dev-frontend smoke test build docker-build clean

install:
	cd backend && uv venv --python 3.11 && uv pip install -e .
	cd frontend && pnpm install

dev-backend:
	cd backend && .venv/bin/uvicorn sosofund.api:app --host 127.0.0.1 --port 8787 --reload

dev-frontend:
	cd frontend && pnpm dev

dev:
	@echo "Run 'make dev-backend' in one terminal and 'make dev-frontend' in another."

smoke:
	cd backend && .venv/bin/python -m sosofund.smoke

test:
	cd backend && .venv/bin/python -m pytest tests/ -v

build:
	cd frontend && pnpm build

docker-build:
	docker build -t consilium-backend ./backend

clean:
	rm -f backend/*.db
	rm -rf backend/.venv backend/.pytest_cache backend/.ruff_cache
	rm -rf frontend/node_modules frontend/.next
