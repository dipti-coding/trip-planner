# Trip Planner — Product Roadmap

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Supabase hosted) |
| Auth | Supabase Auth |
| Booking Text Parsing | To be decided |
| Outbound Email | Resend |
| File Storage | Supabase Storage |
| Deployment | Railway (FastAPI) + Expo EAS (mobile) |
| Type Sync | openapi-typescript (FastAPI schema → RN types) |

---

## MVP Scope

1. User profile tied to email with home city and travel activity preferences
2. Create a trip (name, destination, dates) and receive a Trip ID
3. Paste hotel/flight confirmation text → Text parsed → plan added to trip
4. Supported plan types: Activity, Restaurant, Meeting, Flight, Hotel, Tour, Car Reservation, Cruise, Ferry Ride, Map Destination, Railway Ride, Bus Ride, Local Event
5. Share read-only trip itinerary with others via email
6. Live weather icons displayed next to each plan

---

## Week 1 — Backend Foundation

**Goal:** Core API running locally with auth and database wired up.

### Backend
- [ ] Initialize FastAPI project structure (`/app`, `/models`, `/routes`, `/services`)
- [ ] PostgreSQL schema design
  - `users` (id, email, home_city, activity_preferences[], created_at)
  - `trips` (id, trip_id, user_id, name, destination_city, start_date, end_date, created_at)
  - `plans` (id, trip_id, type, title, start_datetime, end_datetime, details JSONB, created_at)
- [ ] Supabase project setup (Postgres + Auth)
- [ ] Auth routes: POST `/auth/register`, POST `/auth/login` (JWT via Supabase Auth)
- [ ] User profile routes: GET/PUT `/users/me` (home city, preferences)
- [ ] Trip routes: POST `/trips`, GET `/trips`, GET `/trips/{trip_id}`
- [ ] Plan routes: GET `/trips/{trip_id}/plans`, DELETE `/plans/{plan_id}`
- [ ] OpenAPI schema auto-generated and accessible at `/docs`

### Mobile
- [ ] Initialize Expo project (`npx create-expo-app`)
- [ ] Install and configure navigation (`expo-router`)
- [ ] Scaffold screen structure: Auth, Home (trip list), Trip Detail, Add Plan
- [ ] Set up API client (`axios` instance with base URL + auth header)
- [ ] Generate TypeScript types from FastAPI OpenAPI schema

### Deliverable
A locally running FastAPI with auth, user profile, trip creation, and empty plan list. Expo app navigates between screens (static/mocked data is fine).

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
End-to-end flow: create a trip → paste a flight or hotel confirmation → confirm parsed result → view it on the trip timeline.

---

## Week 3 — Weather + Email Sharing

**Goal:** Live weather on the trip view and shareable read-only itineraries via email.

### Backend
- [ ] Integrate OpenWeatherMap API (free tier sufficient for MVP)
  - `GET /trips/{trip_id}/weather` — fetches current conditions for the trip destination
  - Returns icon code, temperature, condition per day of trip
- [ ] Build read-only trip share token: `POST /trips/{trip_id}/share` → returns a signed `share_token`
- [ ] Public endpoint `GET /share/{share_token}` — returns full trip + plans, no auth required
- [ ] Integrate Resend for outbound email
  - `POST /trips/{trip_id}/share/email` — accepts recipient email, sends formatted itinerary with share link
  - Email template: trip name, destination, dates, plan list ordered chronologically

### Mobile
- [ ] Weather strip on Trip Detail screen: weather icon + temperature per trip day
- [ ] Plan cards show weather icon for the day of that plan
- [ ] Share button on Trip Detail → email input modal → success confirmation
- [ ] Read-only trip view (rendered from share token, no auth required — accessible via deep link or web browser)

### Deliverable
A complete trip view with weather, and the ability to email a read-only link to someone who can view the full itinerary without an account.

---

## Week 4 — Polish, Testing + Deployment

**Goal:** MVP is stable, deployed, and ready for TestFlight.

### Backend
- [ ] Deploy FastAPI to Railway (environment variables, Postgres connection, health check)
- [ ] Add request logging and basic error monitoring (Sentry or Railway built-in logs)
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
MVP live on TestFlight. Full flow: sign up → create trip → paste confirmation → view plans with weather → share itinerary via email.

---

## Booking Confirmation Parsing — Options Considered

The paste-box feature (Week 2) requires extracting structured data from unstructured booking text. Booking confirmations have no standard format — a United Airlines confirmation looks completely different from a Delta one, and Marriott looks nothing like Airbnb. Options evaluated:

| Option | Cost | Reliability | Maintenance | Decision |
|---|---|---|---|---|
| Claude API (Sonnet) | ~$0.003/call | High | None | To be considered based on cost |
| Gemini API | Free tier available | High | None | Valid swap if cost is a concern |
| TripIt API | Paid | Very high | None | Post-MVP — email forwarding only, not paste-box |
| Regex / rule-based | Free | Low | High | Avoided — breaks when providers change templates |
| spaCy / NLTK | Free | Medium | Medium | Useful as supplement only — no booking context awareness |
| Ollama (local LLM) | Server cost | Medium | Medium | Post-MVP at scale — adds infrastructure complexity |

---

## Post-MVP Backlog

| # | Feature | Notes |
|---|---|---|
| 1 | **Collaborative editing** | Multiple users can view and edit the same trip; requires real-time sync (Supabase Realtime or WebSockets) |
| 2 | **Nearby Places** | Google Maps Places API → find restaurants, coffee, activities near plan location → add as Map Destination plan |
| 3 | **PDF itineraries** | Generate and download/print a formatted trip PDF (WeasyPrint on FastAPI or a client-side PDF library) |
| 4 | **Plan recommendations based on empty time slots** | Detect empty time slots in trip → Suggests Breakfast, Lunch, Dinner, or activities based on destination and preferences |
| 5 | **Transit directions** | Public transportation options from current location to plan location (Google Maps Directions API) |
| 6 | **Inbound email parsing** | Users forward booking emails to `trips@yourdomain.com` → Mailgun Inbound webhook → Parsing library parses → plan created automatically |
