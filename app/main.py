from fastapi import FastAPI

from app.routes import ping, plans, trips
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router

app = FastAPI(title="Trip Planner API")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(ping.router)
app.include_router(trips.router)
app.include_router(plans.router)
