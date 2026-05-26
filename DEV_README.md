# Trip Planner — Developer Setup

End-to-end guide for getting the local stack running and verifying it with the `GET /ping` endpoint.

---

## Prerequisites

Install the following tools before starting:

| Tool | Install |
|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Required to run local Postgres and the API |
| [Just](https://just.systems/man/en/packages.html) | Task runner (`brew install just`) |
| [Hermit](https://cashapp.github.io/hermit/usage/get-started/) | Hermetic toolchain manager |
| Python 3.12+ | Managed via Hermit (see below) |
| Node 20+ | Managed via Hermit (see below) |
| Terraform 1.7+ | Managed via Hermit (see below) |

### Install Hermit

```bash
curl -fsSL https://github.com/cashapp/hermit/releases/download/stable/install.sh | /bin/bash
```

Install shell hooks so Hermit auto-activates when you `cd` into the repo:

```bash
hermit shell-hooks --zsh   # or --bash / --fish
```

Open a new terminal — Hermit will activate automatically when you enter the project directory. You should see the hermit prompt indicator. No manual sourcing needed.

---

## First-Time Setup

**1. Clone the repo**

```bash
git clone https://github.com/dipti-coding/trip-planner.git
cd trip-planner
```

Hermit will auto-activate if you've installed the shell hooks (see above). If not, run `source bin/activate-hermit`.

**2. Copy environment variables**

```bash
cp .env.example .env
```

The defaults in `.env.example` work for local development. If ports 5432 or 8000 are taken by another process (e.g. on a shared machine), set `POSTGRES_PORT` and `API_PORT` in `.env` to free ports. Do not commit `.env`.

**3. Install system dependencies**

```bash
brew install tesseract
```

Tesseract is required for screenshot OCR (`POST /trips/{trip_id}/plans/parse-screenshot`).

**4. Install Python dependencies**

```bash
python -m venv .venv
pip install -r requirements.txt
```

The venv is activated automatically for all `just` commands — no need to `source .venv/bin/activate` in your shell.

**5. Install Node dependencies** (React Native workspace root)

```bash
npm install
```

---

## Start the Local Stack

**Start Postgres and the API in Docker:**

```bash
just up
```

This builds the API image if needed, starts both containers, and waits until Postgres and the API pass their health checks before returning.

**Run database migrations:**

```bash
just migrate
```

The API is now running at `http://localhost:${API_PORT}` (default 8000). Interactive docs are at `/docs`.

> **Backend hot reload without Docker:** If you're actively iterating on Python code and want faster reloads without rebuilding the image, stop the API container (`docker compose stop api`) and run `just dev` instead. It binds to the same port.

---

## Run the iOS Simulator

**Boot iPhone 16 Pro and launch the app:**

```bash
just ios
```

Syncs CocoaPods if needed, boots the simulator, and starts the app.

**See all available simulators:**

```bash
just ios-list
```

**Boot a specific simulator by number:**

```bash
just ios 3   # boots whichever model is at position 3 in ios-list
```

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

**Verify via the API** (with `just up` running):

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

## Plan Creation Endpoints

These endpoints let you create trips and plans manually. Run `just dev` and `just seed` first so a seeded user ID is available.

**Get a user ID from the seeded data:**

```bash
curl -s http://localhost:8000/trips | python3 -c "import sys,json; t=json.load(sys.stdin); print(t[0]['user_id'])"
```

### Create a trip

```bash
curl -s -X POST http://localhost:8000/trips \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "96a84b90-d7d7-4f6a-8691-d084deda8991",
    "name": "Hawaii Fall 2026",
    "destination_city": "Maui, Hawaii",
    "start_date": "2026-10-01",
    "end_date": "2026-10-08"
  }' | python3 -m json.tool
```

Copy the `id` from the response — you'll use it as `<trip_id>` below.

### Create a Flight plan

```bash
curl -s -X POST http://localhost:8000/trips/<trip_id>/plans \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Flight",
    "title": "JFK → FCO — Alitalia AZ 608",
    "start_datetime": "2026-10-01T09:00:00Z",
    "end_datetime": "2026-10-01T22:30:00Z",
    "details": {
      "airline": "Alitalia",
      "flight_number": "AZ 608",
      "departure_airport": "JFK",
      "arrival_airport": "FCO",
      "seat": "12A",
      "cabin_class": "Economy"
    }
  }' | python3 -m json.tool
```

### Create a Hotel plan

```bash
curl -s -X POST http://localhost:8000/trips/<trip_id>/plans \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Hotel",
    "title": "Hotel de Russie",
    "start_datetime": "2026-10-01T23:00:00Z",
    "end_datetime": "2026-10-08T11:00:00Z",
    "details": {
      "room_type": "Superior Room",
      "confirmation": "HDR20261001"
    }
  }' | python3 -m json.tool
```

### Create a plan with no details (e.g. Activity)

`details` is optional — omit it or pass `{}` for plan types with no required fields.

```bash
curl -s -X POST http://localhost:8000/trips/<trip_id>/plans \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Activity",
    "title": "Colosseum Tour",
    "start_datetime": "2026-10-03T09:00:00Z"
  }' | python3 -m json.tool
```

### Invalid details — expect 422

Sending a wrong type for a field returns a structured validation error:

```bash
curl -s -X POST http://localhost:8000/trips/<trip_id>/plans \
  -H "Content-Type: application/json" \
  -d '{"type": "Restaurant", "title": "Dinner", "details": {"party_size": "four"}}' \
  | python3 -m json.tool
```

### Delete a plan

```bash
curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:8000/plans/<plan_id>
# 204
```

### Supported plan types

All 13 types are accepted for `type`. Each has its own optional `details` fields — see `app/schemas/plan_details.py` for the full field list per type.

| Type | Key detail fields |
|---|---|
| `Flight` | `airline`, `flight_number`, `departure_airport`, `arrival_airport`, `seat`, `cabin_class` |
| `Hotel` | `room_type`, `confirmation`, `loyalty_number` |
| `Activity` | `location`, `notes` |
| `Restaurant` | `reservation_name`, `party_size`, `confirmation` |
| `RailwayRide` | `departure_station`, `arrival_station`, `train_number`, `seat` |
| `CarReservation` | `rental_company`, `pickup_location`, `dropoff_location`, `car_type` |
| `Tour` | `operator`, `meeting_point`, `confirmation` |
| `LocalEvent` | `venue`, `seat`, `event_type` |
| `Meeting` | `meeting_link`, `organizer`, `attendees` |
| `Ferry` / `Cruise` / `BusRide` / `MapDestination` | See `plan_details.py` |

---

## iOS Simulator

### Start the app

From the `mobile/` directory:

```bash
cd mobile
npx react-native run-ios
```

This builds the native app, boots the default simulator (iPhone 16 Pro), installs the app, and starts Metro. On subsequent runs the build is incremental and faster.

Metro must be running for JS changes to load. If it isn't, start it separately:

```bash
cd mobile
npx react-native start
```

### Reloading after code changes

| Situation | How to reload |
|---|---|
| JS-only change (screens, components, styles) | Fast Refresh runs automatically — no action needed |
| Fast Refresh didn't pick up a change | Press **`Cmd+R`** in the simulator window |
| Metro lost the connection / app is stale | Re-launch: `xcrun simctl launch booted org.reactjs.native.example.TripPlanner` |
| Native code changed (new package, iOS config) | Full rebuild: `npx react-native run-ios` from `mobile/` |

### Open the developer menu

Press **`Cmd+D`** in the simulator (or `Cmd+Ctrl+Z` if `Cmd+D` is captured).
From here you can toggle Fast Refresh, open the React DevTools, or reload manually.

### Run on a specific simulator

```bash
# List available simulators
xcrun simctl list devices available

# Target a specific one
npx react-native run-ios --simulator "iPhone 15"
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
| `just up` | Start Postgres + API in Docker |
| `just dev` | Start FastAPI on host with hot reload (alternative to Docker) |
| `just migrate` | Run pending DB migrations |
| `just seed` | Wipe and repopulate DB with test data |
| `just test` | Run test suite |
| `just ping` | Verify the API is responding |
| `just logs` | Tail Docker container logs |
| `just down` | Stop Docker services |
| `just ios` | Boot iPhone 16 Pro simulator and launch the app |
| `just ios-list` | List available iPhone simulators with index numbers |
| `just ios <n>` | Boot simulator at position `n` from `ios-list` |

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
Another process (or another user on a shared machine) is holding the port. Set `POSTGRES_PORT=5433` (or any free port) in `.env` — `docker-compose.yml` picks it up automatically.

**Port 8000 already in use**
Set `API_PORT=8001` (or any free port) in `.env` — `just up`, `just dev`, and `just ping` all pick it up automatically.

**`docker compose` command not found**
The Docker Compose CLI plugin is missing. Link it from Docker Desktop:
```bash
mkdir -p ~/.docker/cli-plugins
ln -sf /Applications/Docker.app/Contents/Resources/cli-plugins/docker-compose ~/.docker/cli-plugins/docker-compose
```

**`python` command not found after `source bin/activate-hermit`**
Hermit's Python package wasn't installed. Run:
```bash
hermit install python3@3.12 node@20 terraform@1.7
```
