from sqlalchemy import Column, Integer, String, Float, Enum
import enum
from app.core.database import Base

class DietCategoryEnum(str, enum.Enum):
    veg = "veg"
    non_veg = "non_veg"
    vegan = "vegan"

class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    diet_category = Column(Enum(DietCategoryEnum), nullable=False, index=True)
    
    # Macros per 100g
    calories_per_100g = Column(Float, nullable=False)
    protein_per_100g = Column(Float, nullable=False)
    carbs_per_100g = Column(Float, nullable=False)
    fat_per_100g = Column(Float, nullable=False)
    
    # Micros/Details
    fiber_g = Column(Float, nullable=True)
    sugar_g = Column(Float, nullable=True)
    sodium_mg = Column(Float, nullable=True)
    cholesterol_mg = Column(Float, nullable=True)
    
    # Context
    description = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
