from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import aiomysql
import asyncio
import os

app = FastAPI()

# ---------------------------
# MySQL Connection Pool Setup
# ---------------------------

POOL = None

async def init_db_pool():
    global POOL
    if POOL is None:
        POOL = await aiomysql.create_pool(
            host="34.28.169.50",
            port=3306,
            user="scop",
            password="Init1234!",
            db="scop",
            minsize=1,
            maxsize=10,
        )
        print("✅ MySQL Pool Connected")

@app.on_event("startup")
async def startup_event():
    await init_db_pool()


@app.on_event("shutdown")
async def shutdown_event():
    global POOL
    if POOL:
        POOL.close()
        await POOL.wait_closed()


# ---------------------------
# Health Check Endpoint
# ---------------------------

@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------
# Example: fetch Dispute Case
# ---------------------------

@app.get("/api/dispute/{case_id}")
async def get_dispute(case_id: str):
    global POOL
    async with POOL.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT * FROM tblDispute WHERE CaseID = %s LIMIT 1",
                (case_id,)
            )
            row = await cur.fetchone()
            return {"data": row}


# ---------------------------
# Example: fetch Promotion
# ---------------------------

@app.get("/api/promotion/{promotion_id}")
async def get_promotion(promotion_id: str):
    global POOL
    async with POOL.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT * FROM tblPromotion WHERE PromotionID = %s LIMIT 1",
                (promotion_id,)
            )
            row = await cur.fetchone()
            return {"data": row}


# ---------------------------
# Example Root
# ---------------------------

@app.get("/")
async def root():
    return {"message": "FastAPI running on Cloud Run!"}
