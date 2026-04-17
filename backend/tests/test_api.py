import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.core.database import Base, get_db

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
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        yield session
        await session.rollback()

@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_register(client):
    r = await client.post("/api/auth/register", json={
        "email": "test@fitai.com",
        "username": "testuser",
        "password": "password123",
        "full_name": "Test User",
    })
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@fitai.com"

@pytest.mark.asyncio
async def test_register_duplicate(client):
    payload = {"email": "dup@fitai.com", "username": "dupuser", "password": "password123"}
    await client.post("/api/auth/register", json=payload)
    r = await client.post("/api/auth/register", json=payload)
    assert r.status_code == 400

@pytest.mark.asyncio
async def test_login(client):
    await client.post("/api/auth/register", json={
        "email": "login@fitai.com", "username": "loginuser", "password": "password123"
    })
    r = await client.post("/api/auth/login", json={
        "email": "login@fitai.com", "password": "password123"
    })
    assert r.status_code == 200
    assert "access_token" in r.json()

@pytest.mark.asyncio
async def test_login_wrong_password(client):
    r = await client.post("/api/auth/login", json={
        "email": "login@fitai.com", "password": "wrongpassword"
    })
    assert r.status_code == 401

@pytest.mark.asyncio
async def test_update_profile(client):
    reg = await client.post("/api/auth/register", json={
        "email": "profile@fitai.com", "username": "profileuser", "password": "password123"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = await client.put("/api/users/me", headers=headers, json={
        "age": 23,
        "weight_kg": 72.0,
        "height_cm": 175.0,
        "gender": "male",
        "goal": "muscle_gain",
        "activity_level": "sedentary",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["age"] == 23
    assert data["bmr"] is not None
    assert data["tdee"] is not None
    assert data["is_onboarded"] is True

@pytest.mark.asyncio
async def test_bmr_calculation():
    from app.services.ai_service import calculate_bmr, calculate_tdee, calculate_targets
    bmr = calculate_bmr(72, 175, 23, "male")
    assert 1700 < bmr < 1900  # reasonable range for this profile

    tdee = calculate_tdee(bmr, "sedentary")
    assert tdee > bmr

    targets = calculate_targets(tdee, "muscle_gain", 72)
    assert targets["target_calories"] > tdee
    assert targets["protein_g"] > 100

@pytest.mark.asyncio
async def test_log_progress(client):
    reg = await client.post("/api/auth/register", json={
        "email": "log@fitai.com", "username": "loguser", "password": "password123"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = await client.post("/api/logs/", headers=headers, json={
        "weight_kg": 72.5,
        "calories_consumed": 2600,
        "workout_completed": True,
        "workout_duration_min": 60,
        "mood_score": 4,
    })
    assert r.status_code == 201
    assert r.json()["weight_kg"] == 72.5

@pytest.mark.asyncio
async def test_unauthorized_access(client):
    r = await client.get("/api/users/me")
    assert r.status_code == 403
