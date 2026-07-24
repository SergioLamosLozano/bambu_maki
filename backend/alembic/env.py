import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from dotenv import load_dotenv

from alembic import context

# Import your models here to load them into metadata
from app.models.models import Base

load_dotenv()

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Override sqlalchemy.url with env var
db_url = os.getenv("DATABASE_URL")
if db_url:
    # Escape % for configparser
    db_url_escaped = db_url.replace("%", "%%")
    config.set_main_option("sqlalchemy.url", db_url_escaped)

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


from sqlalchemy.ext.asyncio import create_async_engine

async def run_async_migrations() -> None:
    url = config.get_main_option("sqlalchemy.url")
    connectable = create_async_engine(
        url,
        poolclass=pool.NullPool,
        connect_args={"statement_cache_size": 0, "prepared_statement_cache_size": 0},
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
