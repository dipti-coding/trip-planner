# Development Progress

## Week 1 — Backend Foundation + DB Schema + Simulator Connection

### Deployment Infra
- [x] Docker Compose — local Postgres 16 with named volume and health check
- [x] Justfile — `just up`, `just down`, `just dev`, `just migrate`, `just test`, `just ping`, `just logs`
- [x] Python virtualenv + `requirements.txt` (FastAPI, SQLAlchemy, Alembic, psycopg2, pytest, httpx)
- [x] `.env.example` with Postgres and `DATABASE_URL` defaults
- [x] Alembic scaffolding — `alembic.ini` + `alembic/env.py` wired to `DATABASE_URL`
- [x] Terraform scaffolding — `infra/` with `main.tf`, `variables.tf`, `outputs.tf` stubs for AWS Aurora (Week 4)
- [x] NPM workspace root (`package.json`) for React Native tooling
- [ ] Hermit — toolchain pinning (Python, Terraform, Node)

### Backend
- [x] FastAPI project structure — `app/`, `app/routes/`, `app/models/`, `app/services/`
- [x] `GET /ping` — returns `{"message": "Hello from Trip Planner"}`, verified locally
- [x] PostgreSQL schema design + SQLAlchemy models (users, trips, plans) with UUID PKs, ARRAY, JSONB, and plantype enum
- [x] Pydantic schemas for all 13 plan types (`app/schemas/plan_details.py`) + `PlanResponse` and `PLAN_DETAILS_SCHEMA` map
- [x] Alembic migration (`ca9748030000_initial_schema`) — applied and verified locally, all 3 tables confirmed in Postgres
- [x] `app/db.py` — SQLAlchemy engine and `SessionLocal`
- [x] Seed script (`scripts/seed.py`) — 1 user, 1 trip, 8 plans across Flight, Hotel, Activity, Restaurant, RailwayRide, Tour, LocalEvent, CarReservation; `just seed` command added
- [x] `GET /trips` and `GET /trips/{trip_id}` — read-only endpoints with UUID type safety
- [x] `GET /trips/{trip_id}/plans` — read-only endpoint returning plans ordered by start_datetime, verified locally
- [ ] OpenAPI schema at `/docs`

### Mobile
- [ ] Initialize Xcode project
- [ ] Set up API client (`axios` pointing to `http://localhost:8000`)
- [ ] Call `GET /ping` and display response on placeholder screen
- [ ] Call `GET /trips` and render trip list in Simulator
- [ ] Call `GET /trips/{trip_id}/plans` and render plan list for a trip

---

## Week 2 — Auth + Core Endpoints + Booking Text Parsing
_Not started_

## Week 3 — Weather + PDF Export
_Not started_

## Week 4 — Polish, Testing + Deployment
_Not started_
