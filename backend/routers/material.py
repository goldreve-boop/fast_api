from fastapi import APIRouter

router = APIRouter(
    prefix="/api/material",
    tags=["Material"]
)

@router.get("/")
async def get_material_root():
    return {"message": "Material API running"}
