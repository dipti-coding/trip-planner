from fastapi import APIRouter

router = APIRouter()


@router.get("/ping")
def ping():
    return {"message": "Hello from Trip Planner"}
