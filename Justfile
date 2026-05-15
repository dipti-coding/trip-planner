set dotenv-load

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
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

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
    curl -s http://localhost:8000/ping | python3 -m json.tool
