from fastapi import APIRouter

router = APIRouter(
    prefix="/api/claim",
    tags=["Claim"]
)

@router.get("/")
async def get_claim_root():
    return {"message": "Claim API running"}
