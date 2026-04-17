from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

class GenderEnum(str, Enum):
    male = "male"
    female = "female"
    other = "other"

class GoalEnum(str, Enum):
    weight_loss = "weight_loss"
    muscle_gain = "muscle_gain"
    maintain = "maintain"
    endurance = "endurance"

class ActivityEnum(str, Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    very_active = "very_active"

# ── Auth ──────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[Dict] = None

# ── User Profile ──────────────────────────────
class UserProfileUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=10, le=100)
    weight_kg: Optional[float] = Field(None, ge=20, le=300)
    height_cm: Optional[float] = Field(None, ge=100, le=250)
    gender: Optional[GenderEnum] = None
    goal: Optional[GoalEnum] = None
    activity_level: Optional[ActivityEnum] = None
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    age: Optional[int]
    weight_kg: Optional[float]
    height_cm: Optional[float]
    gender: Optional[str]
    goal: Optional[str]
    activity_level: Optional[str]
    bmr: Optional[float]
    tdee: Optional[float]
    target_calories: Optional[int]
    target_protein_g: Optional[float]
    target_carbs_g: Optional[float]
    target_fat_g: Optional[float]
    is_onboarded: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# ── Plans ─────────────────────────────────────
class GeneratePlanRequest(BaseModel):
    regenerate: bool = False
    dietary_restrictions: Optional[List[str]] = []
    preferred_foods: Optional[List[str]] = []
    available_equipment: Optional[List[str]] = []
    workout_days_per_week: Optional[int] = Field(4, ge=2, le=7)

class MealItem(BaseModel):
    name: str
    quantity: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float

class Meal(BaseModel):
    meal_number: int
    meal_name: str
    time_suggestion: str
    items: List[MealItem]
    total_calories: int
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    preparation_notes: Optional[str]

class DietPlanResponse(BaseModel):
    id: int
    title: str
    total_calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    meals: List[Dict[str, Any]]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class WorkoutPlanResponse(BaseModel):
    id: int
    title: str
    weekly_schedule: Dict[str, Any]
    total_weekly_sets: Optional[int]
    focus_muscles: Optional[List[str]]
    equipment_needed: Optional[List[str]]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ── Progress Log ──────────────────────────────
class ProgressLogCreate(BaseModel):
    weight_kg: Optional[float] = None
    calories_consumed: Optional[int] = None
    protein_consumed_g: Optional[float] = None
    workout_completed: bool = False
    workout_duration_min: Optional[int] = None
    notes: Optional[str] = None
    mood_score: Optional[int] = Field(None, ge=1, le=5)

class ProgressLogResponse(BaseModel):
    id: int
    log_date: datetime
    weight_kg: Optional[float]
    calories_consumed: Optional[int]
    protein_consumed_g: Optional[float]
    workout_completed: bool
    workout_duration_min: Optional[int]
    mood_score: Optional[int]
    notes: Optional[str]

    class Config:
        from_attributes = True
