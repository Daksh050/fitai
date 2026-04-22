from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.plan import DietPlan, WorkoutPlan
from app.models.recommendation import PlanRecommendation
from app.schemas.schemas import (
    GeneratePlanRequest,
    GeneratePlanResponse,
    DietPlanResponse,
    WorkoutPlanResponse,
    PlanRecommendationResponse,
)
from app.services.ai_service import (
    generate_diet_plan,
    generate_workout_plan,
)
from app.services.recommendation_engine import build_plan_recommendation
from typing import List

router = APIRouter()

@router.post("/generate", response_model=GeneratePlanResponse, status_code=202)
async def generate_plans(
    payload: GeneratePlanRequest,
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

    prefs = payload.model_dump()
    recommendation = await build_plan_recommendation(db, current_user, prefs)
    targets = recommendation.diet_prediction["targets"]
    prefs["model_hints"] = {
        **recommendation.diet_prediction,
        **recommendation.workout_prediction,
    }

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

    return GeneratePlanResponse(
        message="Plans generated successfully",
        diet_plan_id=diet_plan.id,
        workout_plan_id=workout_plan.id,
        recommendation_id=recommendation.id,
        model_name=recommendation.model_name,
        model_version=recommendation.model_version,
    )

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

@router.get("/recommendations/latest", response_model=PlanRecommendationResponse)
async def get_latest_recommendation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PlanRecommendation)
        .where(PlanRecommendation.user_id == current_user.id)
        .order_by(PlanRecommendation.created_at.desc(), PlanRecommendation.id.desc())
    )
    recommendation = result.scalars().first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="No recommendation snapshot found")
    return recommendation
