import bcrypt
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import get_password_hash, password_needs_rehash, verify_password
from app.main import app

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http_client:
        yield http_client

    app.dependency_overrides.clear()


def test_password_hash_supports_long_passwords():
    password = "p" * 100
    hashed_password = get_password_hash(password)

    assert hashed_password.startswith("bcrypt_sha256$")
    assert verify_password(password, hashed_password) is True
    assert verify_password("wrong-password", hashed_password) is False
    assert password_needs_rehash(hashed_password) is False


def test_verify_password_supports_legacy_bcrypt_hashes():
    password = "legacy-password" * 8
    legacy_hash = bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")

    assert verify_password(password, legacy_hash) is True
    assert verify_password("not-the-password", legacy_hash) is False
    assert password_needs_rehash(legacy_hash) is True


@pytest.mark.asyncio
async def test_register_accepts_password_longer_than_72_bytes(client):
    long_password = "strong-password-" * 6

    response = await client.post(
        "/api/auth/register",
        json={
            "email": "longpass@fitai.com",
            "username": "longpassuser",
            "password": long_password,
            "full_name": "Long Password",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "longpass@fitai.com"
