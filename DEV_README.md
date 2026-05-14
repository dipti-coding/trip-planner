# Trip Planner — Developer Setup

End-to-end guide for getting the local stack running and verifying it with the `GET /ping` endpoint.

---

## Prerequisites

Install the following tools before starting:

| Tool | Install |
|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Required to run local Postgres |
| [Just](https://just.systems/man/en/packages.html) | Task runner (`brew install just`) |
| [Hermit](https://cashapp.github.io/hermit/usage/get-started/) | Hermetic toolchain manager |
| Python 3.12+ | Managed via Hermit (see below) |
| Node 20+ | Managed via Hermit (see below) |
| Terraform 1.7+ | Managed via Hermit (see below) |

### Install Hermit

```bash
curl -fsSL https://github.com/cashapp/hermit/releases/download/stable/install.sh | /bin/bash
```

Then activate the project toolchain from the repo root:

```bash
source bin/activate-hermit
```

This pins Python, Node, and Terraform versions for this project shell session. Re-run each time you open a new terminal, or add it to your shell's `direnv` / `cd` hook.

---

## First-Time Setup

**1. Clone the repo**

```bash
git clone https://github.com/dipti-coding/trip-planner.git
cd trip-planner
source bin/activate-hermit
```

**2. Copy environment variables**

```bash
cp .env.example .env
```

The defaults in `.env.example` work out of the box for local development. Do not commit `.env`.

**3. Install Python dependencies**

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**4. Install Node dependencies** (React Native workspace root)

```bash
npm install
```

---

## Start the Local Stack

**Start Postgres in Docker:**

```bash
just up
```

This runs `docker compose up -d` and waits until Postgres passes its health check before returning.

**Run database migrations:**

```bash
just migrate
```

**Start the FastAPI backend:**

```bash
just dev
```

The API is now running at `http://localhost:8000`. Interactive docs are at `http://localhost:8000/docs`.

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
| `just up` | Start Docker services |
| `just dev` | Start FastAPI with hot reload |
| `just migrate` | Run pending DB migrations |
| `just test` | Run test suite |
| `just ping` | Verify the API is responding |
| `just logs` | Tail Docker container logs |
| `just down` | Stop Docker services |

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
Another Postgres process is running locally. Either stop it (`brew services stop postgresql`) or change `POSTGRES_PORT` in `.env` and update `docker-compose.yml`.
