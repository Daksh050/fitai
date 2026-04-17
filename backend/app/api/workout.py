from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.plan import ProgressLog
from app.schemas.schemas import ProgressLogCreate, ProgressLogResponse

# Workout router
router = APIRouter()

@router.get("/tips")
async def get_workout_tips(current_user: User = Depends(get_current_user)):
    """Returns general workout tips based on user goal"""
    goal = current_user.goal.value if hasattr(current_user.goal, 'value') else current_user.goal or "muscle_gain"
    tips = {
        "muscle_gain": [
            "Progressive overload: increase weight or reps every week",
            "Prioritize compound lifts: squat, deadlift, bench, row",
            "Sleep 7-9 hours for optimal muscle recovery",
            "Eat protein within 2 hours post-workout",
            "Track your lifts to ensure progress",
        ],
        "weight_loss": [
            "Combine strength training with cardio",
            "Stay in a moderate caloric deficit",
            "High-intensity interval training burns more calories",
            "Don't skip resistance training - preserve muscle",
        ],
        "maintain": [
            "Stay consistent with 3-4 workouts per week",
            "Mix strength and cardio",
            "Listen to your body and rest when needed",
        ],
    }
    return {"goal": goal, "tips": tips.get(goal, tips["muscle_gain"])}
