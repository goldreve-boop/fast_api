from fastapi import APIRouter, Depends
from typing import List
from backend.database import get_db_connection

router = APIRouter(
    prefix="/api/nielsen",
    tags=["Nielsen"]
)

@router.get("/")
async def get_nielsen(limit: int = 1000):
    """
    Retrieve Nielsen data from MySQL.
    Example endpoint:
    GET /api/nielsen?limit=1000
    """
    conn = await get_db_connection()
    async with conn.cursor() as cur:
        await cur.execute(f"""
            SELECT 
                CleanDate,
                Customer,
                UPC,
                UVol,
                BaselineUVol,
                IncrementalUVol,
                EqVol
            FROM tblNielsen
            LIMIT {limit}
        """)
        result = await cur.fetchall()

    await conn.ensure_closed()
    return {"rows": result}
