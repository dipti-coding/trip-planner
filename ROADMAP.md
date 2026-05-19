# Trip Planner — Technical Roadmap

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Aurora) |
| Auth | AWS Auth |
| Booking Text Parsing | External library or in-house parsing logic |
| Deployment | Justfiles | Hermit | Terraform | Docker Compose | NPM |
| Type Sync | openapi-typescript (FastAPI schema → RN types) |

---

## MVP Scope

1. User profile tied to email with home city and travel activity preferences
2. Create a trip (name, destination, dates) and receive a Trip ID
3. Paste hotel/flight confirmation text → Text parsed → plan added to trip
4. Supported plan types: Activity, Restaurant, Meeting, Flight, Hotel, Tour, Car Reservation, Cruise, Ferry Ride, Map Destination, Railway Ride, Bus Ride, Local Event
5. Support download of PDF version of trip 
6. Live weather icons displayed next to each plan

---

## 5. Data Models

```
User
  id, email, home_city, created_at
  preferences: [activity_type]

Trip
  id (public trip ID), owner_user_id
  name, destination_city, start_date, end_date
  created_at, updated_at

Plan
  id, trip_id
  type (enum: Activity | Restaurant | Meeting | Flight | Hotel | Tour |
              CarReservation | Cruise | Ferry | MapDestination |
              RailwayRide | BusRide | LocalEvent)
  name, date, start_time, end_time, location, notes
  type_specific_fields (JSON)
  created_at, updated_at
```

---

## Week 1 — Backend Foundation + DB Schema + Simulator Connection

**Goal:** Local stack running, schema defined, and DB data visible in the Xcode Simulator.

### Deployment Infra
- [ ] Install Hermit and pin toolchain versions (Python, Terraform, Node)
- [ ] Docker Compose setup: local Postgres container with named volume, health check, and `.env` wiring
- [ ] Justfile with core dev commands: `just up` (start services), `just migrate` (run DB migrations), `just dev` (start FastAPI with hot reload), `just test`
- [ ] Terraform scaffolding for AWS Aurora — directory structure and variable stubs (not applied until Week 4)
- [ ] `package.json` / NPM workspace root configured for React Native tooling

### Backend
- [ ] Initialize FastAPI project structure (`/app`, `/models`, `/routes`, `/services`)
- [ ] `GET /ping` — returns `{"message": "Hello from Trip Planner"}` with 200; used to verify local stack is running end-to-end
- [ ] PostgreSQL schema design + SQLAlchemy models
  - `users` (id, email, home_city, activity_preferences[], created_at)
  - `trips` (id, trip_id, user_id, name, destination_city, start_date, end_date, created_at)
  - `plans` (id, trip_id, type, title, start_datetime, end_datetime, details JSONB, created_at)
- [ ] Alembic migration to apply schema to local Postgres
- [ ] Seed script — insert sample trip and plans for simulator testing
- [ ] `GET /trips` and `GET /trips/{trip_id}/plans` — read-only endpoints returning seeded data (no auth yet)
- [ ] OpenAPI schema auto-generated and accessible at `/docs`

### Mobile
- [ ] Initialize Xcode project
- [ ] Set up API client (`axios` instance pointing to `http://localhost:8000`)
- [ ] Call `GET /ping` and display response on a placeholder screen
- [ ] Call `GET /trips` and render a list of trip names in the Simulator
- [ ] Call `GET /trips/{trip_id}/plans` and render a list of plans for a trip

### Deliverable
Xcode Simulator displaying a seeded trip list and plan list fetched live from local Postgres via FastAPI — no auth required yet.

---

## Week 2 — Plan Creation + Text Parsing

**Goal:** Users can manually create any plan type and paste a flight or hotel confirmation to auto-create a plan — no auth required yet.

### Containerization
- [ ] `Dockerfile` for FastAPI — multi-stage build (deps layer + app layer); runs `uvicorn` as entrypoint
- [ ] Update `docker-compose.yml` to add a `backend` service alongside `postgres`; backend waits on Postgres health check before starting
- [ ] `Dockerfile.metro` for the React Native Metro bundler — Node image, installs `mobile/` deps, exposes port 8081
- [ ] Add `metro` service to `docker-compose.yml`; host network mode so the iOS Simulator can reach it at `localhost:8081`
- [ ] `just docker-dev` command — brings up `postgres` + `backend` + `metro` in one command; replaces running each service manually
- [ ] `just logs` tails all service logs; `just logs backend` and `just logs metro` tail a single service; output includes timestamps and service name prefix
- [ ] Document full Docker dev workflow in `DEV_README.md`: single `just docker-dev` to start the stack, `Cmd+R` in Simulator to connect, `just logs` to stream logs

> **Note:** iOS Simulator builds still require Xcode on macOS and cannot run inside Docker. Docker covers the backend and Metro bundler; the native build step (`npx react-native run-ios`) remains a local command.

### Backend
- [ ] `POST /trips` — create a trip (name, destination, dates)
- [ ] `POST /trips/{trip_id}/plans` — manual plan creation for all 13 plan types; validates type-specific `details` fields per type
- [ ] Integrate text parsing library (external or in-house)
- [ ] `POST /trips/{trip_id}/plans/parse` — accepts raw pasted confirmation text, extracts structured plan (Flight + Hotel to start), persists and returns the created plan
- [ ] `DELETE /plans/{plan_id}` — delete a plan
- [ ] Input validation and graceful error response if text cannot be parsed
- [ ] Generate and expose OpenAPI schema at `/docs`

### Mobile
- [ ] Generate TypeScript types from FastAPI OpenAPI schema (`openapi-typescript`)
- [ ] Add Plan flow: type selector screen → per-type form → `POST /trips/{trip_id}/plans`
- [ ] Paste-box screen: text input → calls `/parse` → shows parsed result for user confirmation → saves on confirm
- [ ] Newly created/parsed plans appear on TripDetailScreen immediately
- [ ] Delete plan with swipe gesture → calls `DELETE /plans/{plan_id}`

### Deliverable
End-to-end plan creation: manually add any plan type, or paste a flight/hotel confirmation and confirm the parsed result — all visible on the trip timeline.

---

## Week 3 — Weather + PDF Export

**Goal:** Live weather on the trip view and PDF export of itineraries.

### Backend
- [ ] Integrate OpenWeatherMap API (free tier sufficient for MVP)
  - `GET /trips/{trip_id}/weather` — fetches current conditions for the trip destination
  - Returns icon code, temperature, condition per day of trip
- [ ] PDf Generator logic
  - `POST /trips/{trip_id}/download` — generates PDF version of trip

### Mobile
- [ ] Weather strip on Trip Detail screen: weather icon + temperature per trip day
- [ ] Plan cards show weather icon for the day of that plan
- [ ] Export button on Trip Detail → PDF generated allowing user to save it to the device

### Deliverable
A complete trip view with weather, and the ability to generate a PDF version of the trip.

---

## Week 4 — Auth + Polish, Testing + Deployment

**Goal:** Auth wired up, MVP is stable, deployed, and ready for TestFlight.

### Backend
- [ ] Auth routes: `POST /auth/register`, `POST /auth/login` (AWS Auth)
- [ ] User profile routes: `GET /users/me`, `PUT /users/me` (home city, preferences)
- [ ] Gate all trip and plan endpoints with auth
- [ ] Deploy FastAPI (environment variables, Postgres connection, health check)
- [ ] Add request logging and basic error monitoring (TBD: Sentry)
- [ ] End-to-end API testing for all core flows

### Mobile
- [ ] Auth flow: sign up, log in, log out, persist session token
- [ ] Connect all screens to production API (not localhost)
- [ ] Loading states, error states, and empty states on all screens
- [ ] App icon, splash screen, basic branding
- [ ] EAS Build setup and submit to TestFlight for internal testing

### Polish
- [ ] Trip ID displayed prominently on Trip Detail screen
- [ ] Chronological plan ordering with date separators
- [ ] Confirm before delete (plans + trips)
- [ ] Handle text parse failures gracefully (show raw text, let user manually fill fields)

### Deliverable
MVP live on TestFlight. Full flow: sign up → create trip → paste confirmation → view plans with weather → download trip PDF to view on device.

---

## Post-MVP Backlog (In Priority Order)

| # | Feature | Notes |
|---|---|---|
| 1 | **Nearby Places** | Google Maps Places API → find restaurants, coffee, activities near plan location → add as Map Destination plan |
| 2 | **Transit directions** | Public transportation options from current location to plan location (Google Maps Directions API) |
| 3 | **Plan recommendations based on empty time slots** | Detect empty time slots in trip → Suggests Breakfast, Lunch, Dinner, or activities based on destination and preferences |
| 4 | **Collaborative editing** | Multiple users can view and edit the same trip; requires real-time sync |
| 5 | **Share itineraries** | Provide a itinerary sharing functionality to users through email |
| 6 | **Inbound email parsing** | Users forward booking emails to `trips@yourdomain.com` → Mailgun Inbound webhook → Parsing library parses → plan created automatically |


