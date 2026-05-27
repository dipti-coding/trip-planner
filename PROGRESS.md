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

### Mobile
- [x] Initialized React Native CLI project (v0.85.3) in `mobile/` — iOS app name: TripPlanner
- [x] CocoaPods installed via Bundler (`bundle install && bundle exec pod install`) — 75 pods
- [x] `metro.config.js` updated to resolve hoisted npm workspace modules from root `node_modules`
- [x] `App.tsx` — fetches `GET /trips` and `GET /trips/{trip_id}/plans`, renders trip header + plan list in Simulator
- [x] Seeded trip (Tokyo Summer 2026) and 8 plans displaying live from local Postgres in Xcode Simulator
- [x] Scaffold screen structure: Home (trip list) + Trip Detail — see PlanMyTrip section below
- [x] Set up dedicated API client (`mobile/api/client.ts` — axios)
- [ ] Generate TypeScript types from FastAPI OpenAPI schema

---

## PlanMyTrip — Read-Only Views

Design source: `plan-my-trip-handoff.zip` (IBM Carbon + iOS Weather aesthetic)
Branch: `feature/plan-my-trip-views`

### Mobile
- [x] Feature branch: `feature/plan-my-trip-views`
- [x] React Navigation native-stack installed + wired (Home → TripDetail)
- [x] `mobile/api/client.ts` — axios instance → `http://localhost:8000`
- [x] `mobile/types.ts` — shared Trip + Plan types
- [x] `mobile/screens/HomeScreen.tsx` — trip list with sections (current/upcoming/past), search bar, city-silhouette image cards
- [x] `mobile/screens/TripDetailScreen.tsx` — blue weather header, collapsing title block, scrollable day-strip pills, day plan list
- [x] `mobile/components/PlanCard.tsx` — gradient icon thumb, time/duration, title, type-specific subtitle
- [x] Verified against seed data in iOS Simulator

### Testing with seed data
```
npm install                              # from repo root — install JS dependencies
cd mobile/ios && bundle exec pod install # link native modules (including react-native-screens)
just seed                                # populate Tokyo Summer 2026 + 8 plans
just dev                                 # FastAPI on :8000
cd mobile && npm run ios                 # build and open Simulator
```

---

## Week 2 — Auth + Core Endpoints + Booking Text Parsing

### Carry-over from Week 1
- [ ] OpenAPI schema verified at `/docs`
- [ ] Hermit — toolchain pinning (Python, Terraform, Node)

### Backend — Plan CRUD + Text Parsing (2026-05-20)
Branch: `feature/ios-plan-text-parsing`
- [x] `POST /trips` — create a trip
- [x] `POST /trips/{trip_id}/plans` — manual plan creation for all 13 plan types with per-type `details` validation
- [x] `DELETE /plans/{plan_id}` — delete a plan
- [x] In-house regex text parsing (`app/services/parsing.py`) — keyword scoring for type detection, date extraction, field extractors for all 13 plan types
- [x] `POST /trips/{trip_id}/plans/parse-and-create` — accepts pasted confirmation text, parses and creates plan; validates dates against trip date range
- [x] `tests/test_plans.py` — 20 tests covering all 13 plan types + error cases
- [x] Trip date range validation — rejects plans with dates outside trip start/end

### Mobile — Add Plan Modal + Text Paste (2026-05-20)
Branch: `feature/ios-plan-text-parsing`
- [x] Add Plan FAB on Trip Detail screen
- [x] Bottom-sheet modal with multiline text input for pasting confirmation text
- [x] Calls `parse-and-create`, refreshes plan list on success, surfaces parse errors inline

### Backend — Screenshot OCR Endpoint (2026-05-20)
Branch: `feature/screenshot-ocr-backend` — PR #8
- [x] `app/services/ocr.py` — `extract_text_from_image` via pytesseract + Pillow
- [x] `POST /trips/{trip_id}/plans/parse-screenshot` — accepts image upload, runs OCR, feeds into existing parsing pipeline
- [x] Refactored shared parse → validate → create logic into `_create_plan_from_text` helper (reused by both parse endpoints)
- [x] `TesseractNotFoundError` returns 500 with install instructions (not swallowed as a user-facing 422)
- [x] `pytesseract`, `Pillow`, `python-multipart` added to `requirements.txt`
- [x] 3 new tests: screenshot happy path (mocked OCR), invalid image, trip not found
- [x] `brew install tesseract` added to DEV_README First-Time Setup

### Mobile — Screenshot Tab (2026-05-20)
Branch: `feature/screenshot-ocr-mobile` — PR #10
- [x] Paste / Screenshot tab toggle in the AddPlan modal
- [x] Screenshot mode: photo library picker (`react-native-image-picker`), thumbnail preview, multipart POST to `parse-screenshot`
- [x] `NSPhotoLibraryUsageDescription` added to `Info.plist` — triggers iOS photo access prompt
- [x] `scripts/test_ocr.py` + `just test-ocr <image>` — local OCR + parsing test tool

### Known limitations / open issues
- Multi-leg itineraries (round trip, multi-city) only parse the first flight — issue #9
- OCR drops text rendered on colored backgrounds or in stylized fonts (e.g. date headers in booking confirmations)
- "Open Settings" alert for photo permission does not deep-link correctly — issue #11

### Backend — Delete Endpoints (2026-05-26)
Branch: `feature/delete-trip` — PR #14
Branch: `feature/get-plan` — PR #15
- [x] `DELETE /trips/{trip_id}` — deletes trip and cascades to all associated plans
- [x] `GET /plans/{plan_id}` — fetch a single plan by ID

### Mobile — Delete Plans + Delete Trips (2026-05-26)
Branch: `feature/delete-plan-mobile` — PR #16
Branch: `feature/delete-trip-mobile` — PR #17
- [x] Delete plan button (dark "−" circle) on each `PlanCard` in Trip Detail screen — Alert confirmation before `DELETE /plans/{plan_id}`
- [x] Delete trip button (dark grey "−" circle, right-aligned) on each `TripCard` in Home screen — Alert confirmation before `DELETE /trips/{trip_id}`, cascades removal from local state

### Scripts — Hotel Booking Test Template (2026-05-26)
Branch: `feature/delete-plan-mobile` — PR #16
- [x] Renamed `generate_test_airbnb_booking.py` → `generate_test_hotel_booking.py`
- [x] Replaced `culver-booking.png` with Hyatt Place `hotel-booking.png` in `tests/booking_templates/`
- [x] Added `hotel` template to `TEMPLATES` with per-template font sizes and coordinate config

### Mobile — HIG Scroll View Improvements (2026-05-26)
Branch: `feature/scroll-views` — PR #18 (open)
- [x] `HomeScreen` `FlatList`: `keyboardDismissMode="on-drag"` — keyboard dismisses when user scrolls the trip list
- [x] `HomeScreen` `FlatList`: `keyboardShouldPersistTaps="handled"` — card taps work while search keyboard is open
- [x] `TripDetailScreen` day strip: `decelerationRate="fast"` — snappier horizontal pill navigation
- [x] `TripDetailScreen` main scroll: `scrollIndicatorInsets={{ bottom: 80 }}` — indicator track clears the Add Plan FAB

### Backend + Mobile — JWT Authentication Phase 1 (2026-05-27)
Branch: `feature/jwt-auth` — PR #21

- [x] `POST /auth/token` — OAuth2 password form endpoint; verifies credentials against env vars, returns signed JWT
- [x] `app/auth.py` — JWT creation/verification (`python-jose`), bcrypt password check (`bcrypt`), `get_current_user` FastAPI dependency
- [x] All 8 trips and plans routes protected with `Depends(get_current_user)`
- [x] `python-jose[cryptography]` and `bcrypt>=4.0.0` added to `requirements.txt` (replaced passlib — incompatible with bcrypt 4.x on Python 3.14)
- [x] `.env.example` updated with `JWT_SECRET_KEY`, `JWT_EXPIRE_MINUTES`, `AUTH_USER_EMAIL`, `AUTH_USER_PASSWORD_HASH` and generation commands
- [x] `load_dotenv()` added to `app/auth.py` to ensure env vars are loaded before module-level reads
- [x] `just gen-docker-env` recipe — generates `.env.docker` from `.env`, stripping quotes and escaping `$` → `$$` so Docker Compose doesn't interpolate bcrypt hashes; `.env.docker` is gitignored
- [x] `just up` runs `gen-docker-env` as a dependency before starting Docker Compose
- [x] `docker-compose.yml` updated to use `env_file: .env.docker` instead of `.env`
- [x] `mobile/api/auth.ts` — fetches and in-memory caches a JWT using hardcoded dev credentials; `clearToken()` exposed for 401 recovery
- [x] `mobile/api/client.ts` — request interceptor attaches `Authorization: Bearer`; response interceptor clears token on 401
- [x] `tests/test_auth.py` — 6 tests: login success, wrong password, wrong email, no token, valid token, bad token
- [x] `tests/conftest.py` — `client` fixture overrides `get_current_user` so all existing route tests pass without auth headers
- [x] Verified in iOS Simulator: trip list loads without 401 errors

## Week 3 — Weather + PDF Export
_Not started_

## Week 4 — Polish, Testing + Deployment
_Not started_
