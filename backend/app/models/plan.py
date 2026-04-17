from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class DietPlan(Base):
    __tablename__ = "diet_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="My Diet Plan")
    total_calories = Column(Integer)
    protein_g = Column(Float)
    carbs_g = Column(Float)
    fat_g = Column(Float)
    meals = Column(JSON)           # List of 4-5 meals with foods, macros, instructions
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="diet_plans")


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="My Workout Plan")
    weekly_schedule = Column(JSON)   # {mon: [...], tue: rest, ...}
    total_weekly_sets = Column(Integer)
    focus_muscles = Column(JSON)     # ["chest", "back", ...]
    equipment_needed = Column(JSON)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="workout_plans")


class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_date = Column(DateTime(timezone=True), server_default=func.now())
    weight_kg = Column(Float)
    calories_consumed = Column(Integer)
    protein_consumed_g = Column(Float)
    workout_completed = Column(Boolean, default=False)
    workout_duration_min = Column(Integer)
    notes = Column(Text)
    mood_score = Column(Integer)   # 1-5

    user = relationship("User", back_populates="progress_logs")
