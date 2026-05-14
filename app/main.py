from fastapi import FastAPI

from app.routes import ping

app = FastAPI(title="Trip Planner API")

app.include_router(ping.router)
