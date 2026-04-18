from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import engine, Base

# Import all models so SQLAlchemy can resolve relationships
import app.models  # noqa: F401
from app.api import auth, users, plans, nutrition, workout, logs

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup (works for SQLite; for Neon, use alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="FitAI API",
    description="AI-powered personalised fitness & nutrition platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",      tags=["Authentication"])
app.include_router(users.router,     prefix="/api/users",     tags=["Users"])
app.include_router(plans.router,     prefix="/api/plans",     tags=["AI Plans"])
app.include_router(nutrition.router, prefix="/api/nutrition", tags=["Nutrition"])
app.include_router(workout.router,   prefix="/api/workout",   tags=["Workout"])
app.include_router(logs.router,      prefix="/api/logs",      tags=["Progress Logs"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "FitAI Backend v2.0"}
