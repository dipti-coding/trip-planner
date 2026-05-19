from fastapi import FastAPI

from app.routes import ping, plans, trips

app = FastAPI(title="Trip Planner API")

app.include_router(ping.router)
app.include_router(trips.router)
app.include_router(plans.router)
