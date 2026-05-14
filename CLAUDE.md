# Trip Planner

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Aurora) |
| Auth | AWS Auth |
| Booking Text Parsing | External library or in-house parsing logic |
| Deployment | Justfiles \| Hermit \| Terraform \| Docker Compose \| NPM |
| Type Sync | openapi-typescript (FastAPI schema → RN types) |

## Project Structure

```
/app        FastAPI application code
/models     SQLAlchemy / Pydantic models
/routes     API route handlers
/services   Business logic
```

## Common Commands

```bash
just up       # Start Docker services (Postgres)
just dev      # Start FastAPI with hot reload
just migrate  # Run DB migrations
just test     # Run test suite
```
