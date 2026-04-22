# Import all models here so SQLAlchemy can resolve relationships correctly
from app.models.user import User, GenderEnum, GoalEnum, ActivityEnum  # noqa: F401
from app.models.plan import DietPlan, WorkoutPlan, ProgressLog  # noqa: F401
from app.models.recommendation import RecommendationDatasetRow, PlanRecommendation  # noqa: F401
