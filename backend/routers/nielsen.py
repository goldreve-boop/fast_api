from fastapi import APIRouter
from backend.database import get_db_connection, release_db_connection

router = APIRouter(
    prefix="/api/nielsen",
    tags=["Nielsen"]
)

@router.get("/")
async def get_nielsen(limit: int = 1000):
    conn = await get_db_connection()
    cur = await conn.cursor(aiomysql.DictCursor)

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

    rows = await cur.fetchall()
    await release_db_connection(conn)

    return {"rows": rows}
