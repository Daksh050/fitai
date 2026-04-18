from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    get_password_hash,
    password_needs_rehash,
    verify_password,
)
from app.models.user import User
from app.schemas.schemas import UserRegister, UserLogin, Token, UserResponse

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where((User.email == payload.email) | (User.username == payload.username))
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or username already registered")

    user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return Token(
        access_token=token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "is_onboarded": user.is_onboarded,
        }
    )

@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if password_needs_rehash(user.hashed_password):
        user.hashed_password = get_password_hash(payload.password)
        await db.flush()

    token = create_access_token({"sub": str(user.id)})
    return Token(
        access_token=token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "is_onboarded": user.is_onboarded,
            "goal": user.goal.value if user.goal and hasattr(user.goal, 'value') else user.goal,
            "weight_kg": user.weight_kg,
            "age": user.age,
            "height_cm": user.height_cm,
            "gender": user.gender.value if user.gender and hasattr(user.gender, 'value') else user.gender,
            "activity_level": user.activity_level.value if user.activity_level and hasattr(user.activity_level, 'value') else user.activity_level,
            "bmr": user.bmr,
            "tdee": user.tdee,
            "target_calories": user.target_calories,
            "target_protein_g": user.target_protein_g,
            "target_carbs_g": user.target_carbs_g,
            "target_fat_g": user.target_fat_g,
        }
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
