import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncAttrs
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set")

# Supabase pooler requires connection recycling occasionally, though asyncpg handles it pretty well.
# Also require disabling prepared statement cache for transaction pooler mode
engine = create_async_engine(
    DATABASE_URL, 
    echo=False,
    connect_args={
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0
    }
)
async_session = async_sessionmaker(engine, expire_on_commit=False)

class Base(AsyncAttrs, DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        yield session
