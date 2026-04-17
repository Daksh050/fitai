from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.plan import DietPlan, WorkoutPlan
from app.schemas.schemas import GeneratePlanRequest, DietPlanResponse, WorkoutPlanResponse
from app.services.ai_service import (
    generate_diet_plan,
    generate_workout_plan,
    calculate_targets,
)
from typing import List

router = APIRouter()

@router.post("/generate", status_code=202)
async def generate_plans(
    payload: GeneratePlanRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger AI generation of both diet and workout plans"""
    if not current_user.is_onboarded:
        raise HTTPException(status_code=400, detail="Please complete your profile first")

    user_data = {
        "age": current_user.age,
        "weight_kg": current_user.weight_kg,
        "height_cm": current_user.height_cm,
        "gender": current_user.gender.value if hasattr(current_user.gender, 'value') else current_user.gender,
        "goal": current_user.goal.value if hasattr(current_user.goal, 'value') else current_user.goal,
        "activity_level": current_user.activity_level.value if hasattr(current_user.activity_level, 'value') else current_user.activity_level,
    }

    targets = {
        "target_calories": current_user.target_calories or 2500,
        "protein_g": current_user.target_protein_g or 150,
        "carbs_g": current_user.target_carbs_g or 250,
        "fat_g": current_user.target_fat_g or 70,
    }

    prefs = payload.model_dump()

    # Generate plans (in production you'd use Celery/background tasks)
    try:
        diet_data = await generate_diet_plan(user_data, targets, prefs)
        workout_data = await generate_workout_plan(user_data, prefs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    # Deactivate old plans if regenerating
    if payload.regenerate:
        old_diet = await db.execute(
            select(DietPlan).where(DietPlan.user_id == current_user.id, DietPlan.is_active == True)
        )
        for p in old_diet.scalars().all():
            p.is_active = False

        old_workout = await db.execute(
            select(WorkoutPlan).where(WorkoutPlan.user_id == current_user.id, WorkoutPlan.is_active == True)
        )
        for p in old_workout.scalars().all():
            p.is_active = False

    # Save new diet plan
    diet_plan = DietPlan(
        user_id=current_user.id,
        title=diet_data.get("title", "My Diet Plan"),
        total_calories=targets["target_calories"],
        protein_g=targets["protein_g"],
        carbs_g=targets["carbs_g"],
        fat_g=targets["fat_g"],
        meals=diet_data.get("meals", []),
        notes=diet_data.get("notes"),
    )
    db.add(diet_plan)

    # Save new workout plan
    workout_plan = WorkoutPlan(
        user_id=current_user.id,
        title=workout_data.get("title", "My Workout Plan"),
        weekly_schedule=workout_data.get("weekly_schedule", {}),
        total_weekly_sets=workout_data.get("total_weekly_sets"),
        focus_muscles=workout_data.get("focus_muscles", []),
        equipment_needed=workout_data.get("equipment_needed", []),
        notes=workout_data.get("notes"),
    )
    db.add(workout_plan)
    await db.flush()

    return {
        "message": "Plans generated successfully",
        "diet_plan_id": diet_plan.id,
        "workout_plan_id": workout_plan.id,
    }

@router.get("/diet", response_model=List[DietPlanResponse])
async def get_diet_plans(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DietPlan)
        .where(DietPlan.user_id == current_user.id)
        .order_by(DietPlan.created_at.desc())
    )
    return result.scalars().all()

@router.get("/diet/active", response_model=DietPlanResponse)
async def get_active_diet(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DietPlan).where(
            DietPlan.user_id == current_user.id,
            DietPlan.is_active == True
        ).order_by(DietPlan.created_at.desc())
    )
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active diet plan found")
    return plan

@router.get("/workout/active", response_model=WorkoutPlanResponse)
async def get_active_workout(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(WorkoutPlan).where(
            WorkoutPlan.user_id == current_user.id,
            WorkoutPlan.is_active == True
        ).order_by(WorkoutPlan.created_at.desc())
    )
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active workout plan found")
    return plan
