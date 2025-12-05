from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db_pool, get_connection

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 서버 시작 시 MySQL 연결 풀 초기화
@app.on_event("startup")
async def startup_event():
    await init_db_pool()

# 기본 헬스체크
@app.get("/")
async def root():
    return {"status": "FastAPI is running on Cloud Run"}

# Test API - MySQL에서 select 1
@app.get("/api/test-db")
async def test_db():
    conn = await get_connection()
    async with conn.cursor() as cur:
        await cur.execute("SELECT 1;")
        result = await cur.fetchone()
    conn.close()
    return {"db_result": result}

# Dispute Case 조회 예시
@app.get("/api/dispute/{caseId}")
async def get_dispute(caseId: str):
    conn = await get_connection()
    async with conn.cursor() as cur:
        await cur.execute(
            """
            SELECT CaseID, Status, CreatedDate, Description
            FROM tblDispute
            WHERE CaseID = %s
            """,
            (caseId,),
        )
        row = await cur.fetchone()
    conn.close()

    if row:
        return {
            "CaseID": row[0],
            "Status": row[1],
            "CreatedDate": row[2],
            "Description": row[3],
        }
    return {"error": "Not found"}



