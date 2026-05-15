# Trip Planner — Developer Setup

End-to-end guide for getting the local stack running and verifying it with the `GET /ping` endpoint.

---

## Prerequisites

Install the following tools before starting:

| Tool | Install |
|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Required to run local Postgres |
| [Just](https://just.systems/man/en/packages.html) | Task runner (`brew install just`) |
| [Hermit](https://cashapp.github.io/hermit/usage/get-started/) | Hermetic toolchain manager |
| Python 3.12+ | Managed via Hermit (see below) |
| Node 20+ | Managed via Hermit (see below) |
| Terraform 1.7+ | Managed via Hermit (see below) |

### Install Hermit

```bash
curl -fsSL https://github.com/cashapp/hermit/releases/download/stable/install.sh | /bin/bash
```

Then activate the project toolchain from the repo root:

```bash
source bin/activate-hermit
```

This pins Python, Node, and Terraform versions for this project shell session. Re-run each time you open a new terminal, or add it to your shell's `direnv` / `cd` hook.

---

## First-Time Setup

**1. Clone the repo**

```bash
git clone https://github.com/dipti-coding/trip-planner.git
cd trip-planner
source bin/activate-hermit
```

**2. Copy environment variables**

```bash
cp .env.example .env
```

The defaults in `.env.example` work out of the box for local development. Do not commit `.env`.

**3. Install Python dependencies**

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**4. Install Node dependencies** (React Native workspace root)

```bash
npm install
```

---

## Start the Local Stack

**Start Postgres in Docker:**

```bash
just up
```

This runs `docker compose up -d` and waits until Postgres passes its health check before returning.

**Run database migrations:**

```bash
just migrate
```

**Start the FastAPI backend:**

```bash
just dev
```

The API is now running at `http://localhost:8000`. Interactive docs are at `http://localhost:8000/docs`.

---

## Verify End-to-End with Ping

```bash
just ping
```

Expected response:

```json
{
    "message": "Hello from Trip Planner"
}
```

Or hit it directly:

```bash
curl http://localhost:8000/ping
```

---

## Verify the Database Schema

After running `just migrate`, confirm all tables were created:

```bash
docker exec -it trip-planner-postgres-1 psql -U trip_planner -d trip_planner_dev -c "\dt"
```

Expected output:

```
              List of relations
 Schema |      Name       | Type  |    Owner
--------+-----------------+-------+-------------
 public | alembic_version | table | trip_planner
 public | plans           | table | trip_planner
 public | trips           | table | trip_planner
 public | users           | table | trip_planner
```

To inspect a table's columns:

```bash
docker exec -it trip-planner-postgres-1 psql -U trip_planner -d trip_planner_dev -c "\d users"
```

### Adding a new migration

After modifying a SQLAlchemy model in `app/models/`, generate and apply a migration:

```bash
source .venv/bin/activate
alembic revision --autogenerate -m "describe your change"
just migrate
```

To roll back the last migration:

```bash
alembic downgrade -1
```

---

## Testing with Seed Data

Populate the database with a test user, trip, and 8 plans across different plan types:

```bash
just seed
```

Expected output:

```
✓ User:  traveler@example.com (id: ...)
✓ Trip:  Tokyo Summer 2026 (id: ...)
✓ Plans: 8 seeded
    - [Flight] SFO → NRT — United UA 837
    - [Hotel] Shinjuku Granbell Hotel
    - [Activity] Shibuya Crossing & Harajuku
    - [Restaurant] Dinner at Sukiyabashi Jiro
    - [RailwayRide] Shinkansen Tokyo → Kyoto
    - [Tour] Tsukiji Market Food Tour
    - [LocalEvent] Sumo Tournament — Ryogoku Kokugikan
    - [CarReservation] Rental Car — Kyoto Day Trip
```

The seed script wipes and repopulates all data on each run — safe to re-run at any time.

**Verify seeded data in Postgres:**

```bash
docker exec -it trip-planner-postgres-1 psql -U trip_planner -d trip_planner_dev -c "SELECT type, title FROM plans;"
```

**Verify via the API** (with `just dev` running):

```bash
# List all trips — copy the id from the response
curl -s http://localhost:8000/trips | python3 -m json.tool

# Get a specific trip
curl -s http://localhost:8000/trips/<trip_id> | python3 -m json.tool

# List plans for a trip ordered by start_datetime
curl -s http://localhost:8000/trips/<trip_id>/plans | python3 -m json.tool

# Test 404 handling
curl -s http://localhost:8000/trips/00000000-0000-0000-0000-000000000000/plans
```

---

## Run Tests

```bash
just test
```

---

## Tear Down

```bash
just down
```

This stops and removes the Docker containers. The `postgres_data` named volume persists, so your data survives across restarts. To wipe it completely:

```bash
docker compose down -v
```

---

## Other Useful Commands

| Command | What it does |
|---|---|
| `just up` | Start Docker services |
| `just dev` | Start FastAPI with hot reload |
| `just migrate` | Run pending DB migrations |
| `just seed` | Wipe and repopulate DB with test data |
| `just test` | Run test suite |
| `just ping` | Verify the API is responding |
| `just logs` | Tail Docker container logs |
| `just down` | Stop Docker services |

---

## Project Structure

```
app/
  main.py          FastAPI app entry point
  routes/          Route handlers (one file per domain)
  models/          SQLAlchemy models
  services/        Business logic

alembic/
  env.py           Migration environment (reads DATABASE_URL from .env)
  versions/        Migration files

infra/
  main.tf          Terraform — AWS Aurora (Week 4)
  variables.tf     Terraform input variables
  outputs.tf       Terraform outputs

mobile/            React Native app (scaffolded in Week 1)
```

---

## Troubleshooting

**`just up` hangs waiting for Postgres**
Check that Docker Desktop is running: `docker ps`. If the container exited, inspect logs with `just logs`.

**`just migrate` fails with `DATABASE_URL` not set**
Make sure `.env` exists and has been populated: `cp .env.example .env`.

**Port 5432 already in use**
Another Postgres process is running locally. Either stop it (`brew services stop postgresql`) or change `POSTGRES_PORT` in `.env` and update `docker-compose.yml`.
