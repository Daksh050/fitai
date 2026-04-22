from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class RecommendationDatasetRow(Base):
    __tablename__ = "recommendation_dataset_rows"

    id = Column(Integer, primary_key=True, index=True)
    age = Column(Integer, nullable=False)
    weight_kg = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    gender = Column(String, nullable=False, index=True)
    goal = Column(String, nullable=False, index=True)
    activity_level = Column(String, nullable=False, index=True)
    dietary_preference = Column(String, nullable=False, index=True)
    workout_days_per_week = Column(Integer, nullable=False)
    equipment_profile = Column(String, nullable=False)

    diet_strategy = Column(String, nullable=False)
    target_calories = Column(Integer, nullable=False)
    protein_g = Column(Float, nullable=False)
    carbs_g = Column(Float, nullable=False)
    fat_g = Column(Float, nullable=False)

    workout_strategy = Column(String, nullable=False)
    total_weekly_sets = Column(Integer, nullable=False)
    session_duration_min = Column(Integer, nullable=False)
    focus_muscles = Column(JSON, nullable=False, default=list)

    source = Column(String, nullable=False, default="seed_random_forest_v1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PlanRecommendation(Base):
    __tablename__ = "plan_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    model_name = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    feature_snapshot = Column(JSON, nullable=False)
    diet_prediction = Column(JSON, nullable=False)
    workout_prediction = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="plan_recommendations")
