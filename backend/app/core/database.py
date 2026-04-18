from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

db_url = settings.get_database_url()
is_sqlite = "sqlite" in db_url

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    # SQLite doesn't support pool_size/max_overflow
    **({} if is_sqlite else {"pool_size": 5, "max_overflow": 10, "pool_pre_ping": True}),
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
