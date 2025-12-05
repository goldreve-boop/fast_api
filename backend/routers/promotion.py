from fastapi import APIRouter

router = APIRouter(
    prefix="/api/promotion",
    tags=["Promotion"]
)

@router.get("/")
async def get_promotion_root():
    return {"message": "Promotion API running"}
