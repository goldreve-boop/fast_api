import aiomysql
from fastapi import FastAPI

POOL = None

async def init_db_pool():
    global POOL
    POOL = await aiomysql.create_pool(
        host="34.28.169.50",
        port=3306,
        user="scop",
        password="Init1234!",
        db="scop",
        minsize=1,
        maxsize=5,
        autocommit=True,
    )

async def get_conn():
    global POOL
    if POOL is None:
        raise Exception("DB Pool has not been initialized")
    return POOL
