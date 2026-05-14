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

## Week 1 — Backend Foundation

**Goal:** Core API running locally with auth and database wired up.

### Deployment Infra
- [ ] Install Hermit and pin toolchain versions (Python, Terraform, Node)
- [ ] Docker Compose setup: local Postgres container with named volume, health check, and `.env` wiring
- [ ] Justfile with core dev commands: `just up` (start services), `just migrate` (run DB migrations), `just dev` (start FastAPI with hot reload), `just test`
- [ ] Terraform scaffolding for AWS Aurora — directory structure and variable stubs (not applied until Week 4)
- [ ] `package.json` / NPM workspace root configured for React Native tooling

### Backend
- [ ] Initialize FastAPI project structure (`/app`, `/models`, `/routes`, `/services`)
- [ ] `GET /ping` — returns `{"message": "Hello from Trip Planner"}` with 200; used to verify local stack is running end-to-end
- [ ] PostgreSQL schema design
  - `users` (id, email, home_city, activity_preferences[], created_at)
  - `trips` (id, trip_id, user_id, name, destination_city, start_date, end_date, created_at)
  - `plans` (id, trip_id, type, title, start_datetime, end_datetime, details JSONB, created_at)
- [ ] Project setup (Postgres + AWS Auth)
- [ ] Auth routes: POST `/auth/register`, POST `/auth/login`
- [ ] User profile routes: GET/PUT `/users/me` (home city, preferences)
- [ ] Trip routes: POST `/trips`, GET `/trips`, GET `/trips/{trip_id}`
- [ ] Plan routes: GET `/trips/{trip_id}/plans`, DELETE `/plans/{plan_id}`
- [ ] OpenAPI schema auto-generated and accessible at `/docs`

### Mobile
- [ ] Initialize Xcode project 
- [ ] Scaffold screen structure: Auth, Home (trip list), Trip Detail, Add Plan
- [ ] Set up API client (TBD: `axios` instance with base URL + auth header)
- [ ] Call `GET /ping` from the app and display the response on a placeholder screen
- [ ] Generate TypeScript types from FastAPI OpenAPI schema

### Deliverable
A locally running FastAPI (via `just dev`) with Postgres in Docker, verified end-to-end by `GET /ping` returning "Hello from Trip Planner" in the Xcode Simulator.

---

## Week 2 — Booking Text Parsing + Plan Management

**Goal:** Users can paste booking text and have it parsed into structured plans on a trip.

### Backend
- [ ] Integrate text parsing library
- [ ] Build `POST /trips/{trip_id}/plans/parse` endpoint
  - Accepts raw pasted text
  - Sends to parsing library to extract plan type, title, dates/times, confirmation numbers, location, relevant details
  - Returns structured plan JSON and persists to DB
- [ ] The library returns a consistent schema to be add to a specific plan type.
- [ ] Build `POST /trips/{trip_id}/plans` for manual plan creation (non-parsed)
- [ ] Plan `details` field uses JSONB to store type-specific fields (e.g. flight: airline, flight number, seat; hotel: check-in, check-out, room type)
- [ ] Input validation and graceful error handling if booking text cannot be parsed correctly.

### Mobile
- [ ] Trip Detail screen: display trip metadata + list of plans sorted by date/time
- [ ] Plan card components for each plan type with relevant icon
- [ ] Paste-box screen: text input → calls `/parse` endpoint → shows parsed result for confirmation before saving
- [ ] Manual plan creation form (type selector + basic fields)
- [ ] Delete plan with swipe gesture

### Deliverable
Auth, user profile, End-to-end flow: create a trip → paste a flight or hotel confirmation → confirm parsed result → view it on the trip timeline.

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

## Week 4 — Polish, Testing + Deployment

**Goal:** MVP is stable, deployed, and ready for TestFlight.

### Backend
- [ ] Deploy FastAPI (environment variables, Postgres connection, health check)
- [ ] Add request logging and basic error monitoring (TBD: Sentry)
- [ ] End-to-end API testing for all core flows

### Mobile
- [ ] Connect all screens to production API (not localhost)
- [ ] Auth flow polish: sign up, log in, log out, persist session
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


