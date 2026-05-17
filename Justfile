set dotenv-load
export PATH := ".venv/bin:" + env_var('PATH')

# Start local Postgres in Docker and wait until healthy
up:
    docker compose up -d
    @echo "Waiting for Postgres to be ready..."
    @until docker compose exec postgres pg_isready -U trip_planner > /dev/null 2>&1; do sleep 1; done
    @echo "Postgres is ready."

# Stop and remove Docker containers
down:
    docker compose down

# Start FastAPI with hot reload
dev:
    uvicorn app.main:app --reload --host 0.0.0.0 --port ${API_PORT:-8000}

# Run DB migrations
migrate:
    alembic upgrade head

# Run tests
test:
    pytest

# Tail Docker logs
logs:
    docker compose logs -f

# Seed the database with test users, trips, and plans
seed:
    python scripts/seed.py

# Verify the ping endpoint is responding
ping:
    curl -s http://localhost:${API_PORT:-8000}/ping | python3 -m json.tool

# Run iOS app in the booted simulator
ios:
    #!/usr/bin/env bash
    set -euo pipefail
    UDID=$(xcrun simctl list devices booted | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' | head -1)
    if [ -z "$UDID" ]; then
        echo "No booted simulator found. Open Simulator.app and boot a device first."
        exit 1
    fi
    cd mobile && npm run ios -- --udid "$UDID"
