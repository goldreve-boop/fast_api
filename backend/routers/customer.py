from fastapi import APIRouter

router = APIRouter(
    prefix="/api/customer",
    tags=["Customer"]
)

@router.get("/")
async def get_customer_root():
    return {"message": "Customer API running"}
