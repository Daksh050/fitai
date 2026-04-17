from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.plan import ProgressLog
from app.schemas.schemas import ProgressLogCreate, ProgressLogResponse

router = APIRouter()

@router.post("/", response_model=ProgressLogResponse, status_code=201)
async def create_log(
    payload: ProgressLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = ProgressLog(user_id=current_user.id, **payload.model_dump())
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return log

@router.get("/", response_model=List[ProgressLogResponse])
async def get_logs(
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ProgressLog)
        .where(ProgressLog.user_id == current_user.id)
        .order_by(ProgressLog.log_date.desc())
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/summary")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ProgressLog)
        .where(ProgressLog.user_id == current_user.id)
        .order_by(ProgressLog.log_date.desc())
        .limit(7)
    )
    logs = result.scalars().all()
    if not logs:
        return {"message": "No logs yet", "streak": 0, "avg_calories": 0}

    workouts_done = sum(1 for l in logs if l.workout_completed)
    avg_calories = sum(l.calories_consumed or 0 for l in logs) / max(len(logs), 1)
    latest_weight = next((l.weight_kg for l in logs if l.weight_kg), None)

    return {
        "days_logged": len(logs),
        "workouts_this_week": workouts_done,
        "avg_calories_last_7d": round(avg_calories),
        "latest_weight_kg": latest_weight,
        "streak": workouts_done,
    }
