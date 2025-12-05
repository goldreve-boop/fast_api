from fastapi import APIRouter

router = APIRouter(
    prefix="/api/finance",
    tags=["Finance"]
)

@router.get("/")
async def get_finance_root():
    return {"message": "Finance API running"}
