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

### AWS Deployment — ECS Fargate + RDS + ALB + Route53 (2026-05-27)
Branch: `feature/aws-deployment` — PR #22

- [x] `infra/networking.tf` — VPC (10.0.0.0/16), 2 public subnets (ECS), 2 private subnets (RDS), IGW, route table, security groups for ALB / ECS / RDS
- [x] `infra/database.tf` — RDS PostgreSQL 16 `db.t4g.micro` 20 GB gp3 in private subnets, `random_password` resource, Secrets Manager secrets for `db_password` and assembled `DATABASE_URL`
- [x] `infra/secrets.tf` — Secrets Manager shells for `jwt-secret-key`, `auth-user-email`, `auth-user-password-hash` (values set manually post-apply)
- [x] `infra/ecr.tf` — ECR repository with scan-on-push and 10-image lifecycle policy
- [x] `infra/ecs.tf` — ECS cluster, IAM execution role (ECR + CloudWatch + Secrets Manager), task definition injecting all secrets as env vars, Fargate service (1 task, public subnet, public IP — no NAT Gateway)
- [x] `infra/alb.tf` — ALB, target group (health check `/ping`), HTTP→HTTPS redirect listener, HTTPS listener
- [x] `infra/dns.tf` — ACM certificate with DNS validation, Route53 CNAME validation records, Route53 A alias → ALB
- [x] `infra/outputs.tf` — `api_url`, `ecr_repository_url`, `alb_dns_name`
- [x] `infra/main.tf` — added `random` provider; `infra/variables.tf` fully filled out
- [x] `Dockerfile` CMD updated: `alembic upgrade head && uvicorn ...` — schema applied automatically on first deploy
- [x] `alembic/env.py` — fixed to pass `DATABASE_URL` directly to `create_engine` (bypasses configparser which choked on `%` in RDS password)
- [x] Terraform installed at `~/bin/terraform` (v1.9.8); `Justfile` PATH updated; `just tf-init / tf-plan / tf-apply / ecr-push / deploy` recipes added
- [x] Deployed: `https://api.example.com/ping` live, `POST /auth/token` returns JWT, `POST /trips` and `GET /trips` verified
- [x] `DEV_README.md` — Authentication section added with working curl examples; create-trip curl updated with real response
- [x] Hardcoded credentials removed: `mobile/api/auth.ts` reads `TEST_EMAIL`/`TEST_PWD` from react-native-config; `tests/test_auth.py` reads `AUTH_USER_PWD` from env; `mobile/env.d.ts` and both `.env.example` files updated

---

## Design System (2026-05-27)

### Mobile — Design Tokens + theme.ts
Branch: `feature/design-tokens` — PR #19
- [x] `designs/PlanMyTrip.html` — full Claude Design export added as visual source of truth
- [x] `mobile/theme.ts` — colors (light + dark), typography (IBM Plex Sans/Mono, size scale, weights), radii, and spacing tokens extracted from design CSS variables
- [x] `PlanCard.tsx` updated as first consumer — all hardcoded values replaced with token references

### Mobile — Design Alignment Round 2
Branch: `feature/design-alignment-2` — PR #20
- [x] **Timeline view**: hour-grid calendar (6am–10pm, 64px/hour) with colour-coded, absolutely-positioned event blocks
- [x] **Itinerary view**: all-days document with `LinearGradient` day card headers, plan rows, per-day plan/cost footer
- [x] **Day pickers**: radius changed from pill (`radii.chip`) to rounded rectangle (`radii.lg`)
- [x] **Cover palette**: `coverPalette` in `theme.ts` replaced with muted, desaturated tones
- [x] **PlanDetailSheet**: `paddingBottom: 34` added to clear iOS home indicator
- [x] **Trip creation fixed**: hardcoded `DEV_USER_ID` synced between mobile POST body and `scripts/seed.py`
- [x] **iOS build fix**: `react-native-config` workspace install + Xcode build phase reordering to eliminate `error export CLANG_WARN_*` errors

---

## On-Device Intelligence + Native Modules (2026-05-28 – 2026-05-30)

### Mobile — Delete Trip from TripDetailScreen
Branch: `feature/delete-trip-detail` — PR #24
- [x] `•••` glass button in TripDetail nav header — destructive Alert confirmation, calls `DELETE /trips/:id`, navigates back on success
- [x] `HomeScreen` re-fetches on `focus` so deleted trip disappears immediately

### Mobile — Add-Plan Flow Overhaul + Plan Card Cleanup
Branch: `feature/add-plan-overhaul` — PR #25
- [x] "Upload Booking Screenshot": opens Photos Finder directly; thumbnail preview + "Detect & extract" confirm step before submitting
- [x] "Enter Booking Details": all 13 plan types shown in wrapping grid; type sent as backend enum string directly
- [x] Plan card simplified: icon badge + time · duration + title only (removed subtitle and cost)
- [x] Removed text-paste input, "Use sample" link, and quick-type shortcuts from picker screen
- [x] `app/routes/plans.py`: `image: File` → `image: UploadFile` annotation fix (was crashing API on startup)

### Mobile — iOS App Icon
Branch: `feature/app-icon` — PR #26
- [x] All required iPhone icon sizes (40 – 1024px) added to `AppIcon.appiconset` — warm orange `#E07B39` background, compass motif with flight arc and destination pin

### Mobile + Backend — OCR and Parsing Fully On-Device
Branch: `feature/on-device-ocr` — PR #27
- [x] **Drops server-side OCR/parsing** (`pytesseract`, regex `parsing.py`, `ocr.py`) — replaced with native iOS modules
- [x] `OCRModule` (Swift) — Apple Vision framework for on-device text recognition
- [x] `BookingParserModule` (Swift) — Apple FoundationModels / Apple Intelligence for structured extraction; gated behind `#available(iOS 26)`, returns `false` on simulator
- [x] `POST /trips/{id}/plans/from-parsed` — new backend endpoint accepting pre-parsed `PlanCreate` from mobile (no server-side ML)
- [x] `patch-package` postinstall fixes `getBuildSettings` indexing bug in RN CLI for multi-target workspaces

---

## UI Redesign — wandur Branding (2026-05-31 – 2026-06-01)

### Mobile — Plan Cards + Detail Sheet Redesign
Branch: `feature/plan-cards-redesign` — PR #28
- [x] `PlanCard`: 56×56 gradient thumbnail (replaces 38×38 badge); three-line layout — route/name, operator, location — from real backend `details` fields per plan type
- [x] `PlanDetailSheet`: hero uses per-type gradient + large watermark icon; detail rows driven by real schema fields
- [x] `utils/planLines.ts` (new): shared `getPlanLines`, `getDetailRows`, `getMapsQuery` helpers for card/sheet consistency
- [x] `planTypes.ts`: `bg` gradient color pairs added for thumbnails

### Mobile — SVG Destination Covers + wandur Branding
Branch: `feature/svg-covers-and-app-icon` — PR #29
- [x] **Replaces ~24 MB of scraped JPGs** with 7 inline SVG illustrations covering all destination types (city, beach, island, mountain, nature, historical, other)
- [x] **Deterministic per-trip tint** from trip ID (`tripTint`) applied to card covers, detail header, and itinerary day headers
- [x] **App renamed** from "TripPlanner" to "wandur"; icon updated to three wandur variants (default, dark, tinted)
- [x] **Bottom tab bar** hidden on `TripDetail` via `getFocusedRouteNameFromRoute`
- [x] **Wizard thumbnails**: destination rows and chips now show the SVG illustration
- [x] Deleted: `mobile/assets/destinations/images/` (69 JPGs), fallbacks, `CityCovers.tsx`, Wikipedia scraping script

### Backend + Mobile — Real Plan Count + % Planned on Trip Cards
Branch: `feature/trip-plan-stats` — PR #30
- [x] `TripResponse`: added `plan_count`, `scheduled_count`, `percent_planned` fields
- [x] `GET /trips` and `GET /{trip_id}`: plans loaded in a single `IN` query (no N+1); coverage computed via `_percent_planned()`
- [x] Coverage algorithm: buffered windows `[start−1hr, (end or start+1hr)+1hr]` merged, overlapped against 8am–10pm per day, capped at 100%
- [x] `mobile/types.ts` and `HomeScreen.tsx` `TripCard` updated to use real values

### Mobile — Theme System Redesign
Branch: `ankit/theme-system` — PR #31 | `feat/theme-system-redesign` — PR #33
- [x] Full theme token system — splash screen, spinner, app delegate, and launch storyboard updated for consistent dark-mode and light-mode rendering
- [x] `SplashScreen.tsx` and `Spinner.tsx` refactored to use theme tokens throughout
- [x] iOS `AppDelegate.swift` updated to set window background before first render, eliminating white flash on launch

---

## Trip Creation + Bug Fixes (2026-06-02 – 2026-06-03)

### Backend — Multi-Leg Flight Parsing
Branch: `feature/multi-leg-flight-parsing` — PR #34
- [x] Apple Intelligence prompt returns a JSON array — one element per flight leg (round-trip → 2 plans, multi-city → N plans); bare-object fallback for model regressions
- [x] `POST /trips/{id}/plans/from-parsed-bulk` — accepts `list[PlanCreate]`, validates each, bulk-inserts atomically; shared `_build_plan` helper extracted
- [x] Mobile `handleDetect` posts to `from-parsed-bulk` with the array result — no UI changes
- [x] `mobile/ios/tmp.xcconfig` removed from tracking (build artifact with dev credentials); added to `.gitignore`
- [x] `scripts/test_ocr.py` deleted — orphaned since parsing moved on-device
- Closes issue #9

### Mobile — Calendar Date Picker Fix
Branch: `fix/calendar-view-trip-addition` — PR #35
- [x] Calendar in trip creation flow extended from 2 months to 12 rolling months from today

### Mobile — Live Location Search (Photon API)
Branch: `feat/location-lookup-trip-creation` — PR #36
- [x] Replaces static local JSON destination search with live Photon (OpenStreetMap) API
- [x] 350ms debounce on input; empty state ("Top Destinations") still served from local curated list
- [x] `mobile/services/locationService.ts` — normalized abstraction layer; Mapbox swap is a single-file change
- [x] `technical-tradeoffs.md` — documents API decision and scale thresholds
- [x] Fix: deduplicate Photon results by `osm_type+osm_id` to prevent duplicate React keys when the same feature appears across multiple layers

---

## Booking Parser + Plan Type Cleanup (2026-06-08)

### Backend + Mobile — Plan Type Pruning
Branch: `feat/remove-plan-types-tour-localevent-mapdestination` — PR #42
- [x] Removed `Tour`, `LocalEvent`, `MapDestination` from `PlanType` enum, backend schemas, and `PLAN_DETAILS_SCHEMA`
- [x] Alembic migration (`remove_plan_types_0001`) — recreates `plantype` DB enum without the three removed values
- [x] Removed corresponding cases from `planLines.ts` (`getPlanLines`, `getDetailRows`, `getMapsQuery`)
- [x] Removed from `planTypes.ts` icon/color metadata and seed data
- [x] Added `PLAN_TYPE_LABEL` mapping for human-readable button labels (Car Rental, Railway, Bus)
- [x] Type picker last row (Cruise, Meeting) center-aligned

### Mobile — BookingParserPrompt Plan Type Fix
Branch: `fix/booking-parser-prompt-plan-types` — PR #43
- [x] Removed `Tour` and `LocalEvent` from `planType` enum in the parser prompt
- [x] Added `Meeting` which was a valid type but previously missing from the prompt

### Mobile — Multi-Stage Booking Parser Pipeline
Branch: `feat/booking-parser-pipeline` — PR #44
- [x] New `runPrompt(userPrompt, systemPrompt)` Swift method — generic thin wrapper around `LanguageModelSession`; returns raw response string for JS to consume
- [x] `BookingParserPrompt.swift` deleted — all prompts moved to TypeScript
- [x] `mobile/utils/bookingPipeline.ts` — JS-orchestrated pipeline replacing single mega-prompt:
  - Stage 1 (all types): `detectPlanType` — 1 focused LLM call
  - Flight (2 stages): leg structure (airports + times) → shared booking details
  - Hotel (2 stages): check-in/check-out dates → remaining details
  - CarReservation (2 stages): pickup/dropoff locations + dates → booking details
  - Generic fallback: delegates to original Swift `parseBookingText` (preserves `toISO` date normalization)
- [x] `TripDetailScreen.tsx` updated to call `parseBooking(text, tripYear)` from the new pipeline

---

## Week 3 — Weather + PDF Export
_Not started_

## Week 4 — Polish, Testing + Deployment
_Not started_
