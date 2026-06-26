# Trip Planner

A mobile app that helps travelers organize itineraries around their destination, local weather, and personal activity preferences. Users can create trips, parse booking confirmations into structured plans, and share read-only itineraries with others.

Booking confirmations are turned into structured plans by an on-device **Apple Intelligence** layer — Apple Vision OCR extracts text from screenshots, deterministic regex handles known formats, and on-device Apple Intelligence text parsing covers the rest, all without sending data off the device.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Aurora) |
| Auth | AWS Auth |
| Booking Text Parsing | Apple Vision OCR + Regex + on-device Apple Intelligence |
| Deployment | Justfiles · Hermit · Terraform · Docker Compose · NPM |
| Type Sync | openapi-typescript (FastAPI schema → RN types) |

## Getting Started

See **[DEV_README.md](DEV_README.md)** for full setup. The short version:

```sh
just up      # start local Postgres + API
just ping    # verify the stack via GET /ping
```

## Documentation

| Document | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product Requirements Document — the MVP's goals, scope, user stories, and feature definitions. Start here to understand *what* is being built and *why*. |
| [ROADMAP.md](ROADMAP.md) | Technical roadmap — the tech stack and the week-by-week plan for delivering the MVP. |
| [technical-tradeoffs.md](technical-tradeoffs.md) | Running log of architectural decisions — the options evaluated and the rationale behind each choice (auth, parsing, persistence, etc.). |
| [DEV_README.md](DEV_README.md) | Developer setup guide — prerequisites and end-to-end instructions for getting the local stack running and verified. |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Running log of issues hit during development and how they were resolved. Check here when the local environment misbehaves. |
| [CLAUDE.md](CLAUDE.md) | Project conventions and UI design-system rules (sourced from `/designs/PlanMyTrip.html` and `mobile/theme.ts`). |

## Project Structure

```
/app        FastAPI application code
/models     SQLAlchemy / Pydantic models
/routes     API route handlers
/services   Business logic
/designs    Visual design exports (source of truth for UI)
/mobile     React Native app
```
