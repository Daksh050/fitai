from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.schemas import UserProfileUpdate, UserResponse
from app.services.ai_service import calculate_bmr, calculate_tdee, calculate_targets

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_profile(
    payload: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_none=True)

    for key, value in update_data.items():
        setattr(current_user, key, value)

    # Recalculate BMR/TDEE if all required fields present
    if all([current_user.weight_kg, current_user.height_cm, current_user.age, current_user.gender]):
        bmr = calculate_bmr(
            current_user.weight_kg,
            current_user.height_cm,
            current_user.age,
            current_user.gender.value if hasattr(current_user.gender, 'value') else current_user.gender
        )
        tdee = calculate_tdee(
            bmr,
            current_user.activity_level.value if hasattr(current_user.activity_level, 'value') else current_user.activity_level or "sedentary"
        )
        targets = calculate_targets(
            tdee,
            current_user.goal.value if hasattr(current_user.goal, 'value') else current_user.goal or "maintain",
            current_user.weight_kg
        )

        current_user.bmr = round(bmr)
        current_user.tdee = round(tdee)
        current_user.target_calories = targets["target_calories"]
        current_user.target_protein_g = targets["protein_g"]
        current_user.target_carbs_g = targets["carbs_g"]
        current_user.target_fat_g = targets["fat_g"]

        # Mark as onboarded if all fields complete
        if all([current_user.goal, current_user.activity_level]):
            current_user.is_onboarded = True

    db.add(current_user)
    await db.flush()
    await db.refresh(current_user)
    return current_user
