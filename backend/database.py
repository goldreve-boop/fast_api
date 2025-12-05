# backend/database.py
import aiomysql
import asyncio

class Database:
    pool = None

async def init_db():
    if Database.pool is None:
        Database.pool = await aiomysql.create_pool(
            host="YOUR_DB_HOST",
            port=3306,
            user="YOUR_DB_USER",
            password="YOUR_DB_PASSWORD",
            db="YOUR_DB_NAME",
            autocommit=True,
            minsize=1,
            maxsize=5,
        )

async def get_conn():
    if Database.pool is None:
        await init_db()
    return Database.pool
