from fastapi import APIRouter, Depends
from backend.database import get_db_connection, release_db_connection

router = APIRouter(
    prefix="/nielsen",
    tags=["nielsen"]
)

@router.get("/")
async def get_nielsen_sample():
    return {"message": "Nielsen API is working"}

@router.get("/data")
async def get_nielsen_data(limit: int = 10):
    """
    실제 MySQL에서 Nielsen 데이터를 가져오는 예제 API
    """
    conn = await get_db_connection()
    cursor = await conn.cursor()

    try:
        await cursor.execute(
            "SELECT * FROM tblNielsen LIMIT %s",
            (limit,)
        )
        rows = await cursor.fetchall()
        return {"count": len(rows), "rows": rows}

    finally:
        await cursor.close()
        await release_db_connection(conn)
