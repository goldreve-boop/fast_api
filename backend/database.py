import aiomysql
import os

MYSQL_HOST = os.getenv("MYSQL_HOST", "34.28.169.50")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "scop")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "Init1234!")
MYSQL_DB = os.getenv("MYSQL_DB", "scop")

# Connection Pool
pool = None

async def get_pool():
    global pool
    if pool is None:
        pool = await aiomysql.create_pool(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            db=MYSQL_DB,
            autocommit=True,
            minsize=1,
            maxsize=5,
        )
    return pool

async def get_db_connection():
    pool = await get_pool()
    conn = await pool.acquire()
    return conn

async def release_db_connection(conn):
    pool = await get_pool()
    pool.release(conn)
