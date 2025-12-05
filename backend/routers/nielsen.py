from fastapi import APIRouter

router = APIRouter(
    prefix="/api/nielsen",
    tags=["Nielsen"]
)

@router.get("/")
async def get_nielsen_root():
    return {"message": "Nielsen API running"}
