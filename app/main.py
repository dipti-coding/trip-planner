from fastapi import FastAPI

from app.routes import ping, trips

app = FastAPI(title="Trip Planner API")

app.include_router(ping.router)
app.include_router(trips.router)
