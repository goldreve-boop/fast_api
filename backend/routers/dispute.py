from fastapi import APIRouter

router = APIRouter(
    prefix="/api/dispute",
    tags=["Dispute"]
)

@router.get("/")
async def get_dispute_root():
    return {"message": "Dispute API running"}
