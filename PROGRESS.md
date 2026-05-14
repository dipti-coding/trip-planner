# Development Progress

## Week 1 — Backend Foundation

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
- [ ] PostgreSQL schema design (users, trips, plans)
- [ ] Project setup (Postgres + AWS Auth)
- [ ] Auth routes: `POST /auth/register`, `POST /auth/login`
- [ ] User profile routes: `GET /PUT /users/me`
- [ ] Trip routes: `POST /trips`, `GET /trips`, `GET /trips/{trip_id}`
- [ ] Plan routes: `GET /trips/{trip_id}/plans`, `DELETE /plans/{plan_id}`
- [ ] OpenAPI schema at `/docs`

### Mobile
- [ ] Initialize Xcode project
- [ ] Scaffold screen structure: Auth, Home, Trip Detail, Add Plan
- [ ] Set up API client (`axios` with base URL + auth header)
- [ ] Call `GET /ping` and display response on placeholder screen
- [ ] Generate TypeScript types from FastAPI OpenAPI schema

---

## Week 2 — Booking Text Parsing + Plan Management
_Not started_

## Week 3 — Weather + PDF Export
_Not started_

## Week 4 — Polish, Testing + Deployment
_Not started_
