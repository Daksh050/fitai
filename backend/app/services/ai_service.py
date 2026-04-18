import json
import httpx
import uuid
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.services.local_brain import build_local_diet_plan, build_local_workout_plan
from app.services.fitai_brain import generate_structured_plan

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "lightly_active": 1.375,
    "moderately_active": 1.55,
    "very_active": 1.725,
}

GOAL_CALORIE_ADJUSTMENTS = {
    "weight_loss": -500,
    "muscle_gain": +300,
    "maintain": 0,
    "endurance": +200,
}

def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Mifflin-St Jeor Equation"""
    if gender == "male":
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

def calculate_tdee(bmr: float, activity_level: str) -> float:
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level, 1.2)
    return bmr * multiplier

def calculate_targets(tdee: float, goal: str, weight_kg: float) -> Dict[str, float]:
    calorie_adjustment = GOAL_CALORIE_ADJUSTMENTS.get(goal, 0)
    target_calories = tdee + calorie_adjustment

    if goal == "muscle_gain":
        protein_g = weight_kg * 2.2   # ~1g per lb
        fat_g = target_calories * 0.25 / 9
        carbs_g = (target_calories - protein_g * 4 - fat_g * 9) / 4
    elif goal == "weight_loss":
        protein_g = weight_kg * 2.0
        fat_g = target_calories * 0.30 / 9
        carbs_g = (target_calories - protein_g * 4 - fat_g * 9) / 4
    else:
        protein_g = weight_kg * 1.8
        fat_g = target_calories * 0.30 / 9
        carbs_g = (target_calories - protein_g * 4 - fat_g * 9) / 4

    return {
        "target_calories": round(target_calories),
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs_g, 1),
        "fat_g": round(fat_g, 1),
    }

async def fetch_real_foods_from_usda(query: str) -> List[Dict]:
    """Fetch real food data from USDA FoodData Central API"""
    if not settings.USDA_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            resp = await http.get(
                "https://api.nal.usda.gov/fdc/v1/foods/search",
                params={
                    "query": query,
                    "dataType": "SR Legacy,Foundation",
                    "pageSize": 5,
                    "api_key": settings.USDA_API_KEY,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                foods = []
                for item in data.get("foods", [])[:3]:
                    nutrients = {n["nutrientName"]: n["value"] for n in item.get("foodNutrients", [])}
                    foods.append({
                        "name": item["description"],
                        "calories_per_100g": nutrients.get("Energy", 0),
                        "protein_per_100g": nutrients.get("Protein", 0),
                        "carbs_per_100g": nutrients.get("Carbohydrate, by difference", 0),
                        "fat_per_100g": nutrients.get("Total lipid (fat)", 0),
                    })
                return foods
    except Exception:
        pass
    return []

async def generate_diet_plan(
    user_data: Dict[str, Any],
    targets: Dict[str, float],
    preferences: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Generate a personalized 5-meal diet plan."""

    dietary_restrictions = preferences.get("dietary_restrictions", []) if preferences else []
    preferred_foods = preferences.get("preferred_foods", []) if preferences else []

    if user_data.get("dietary_preference"):
        dietary_restrictions.append(f"STRICTLY {user_data.get('dietary_preference').replace('_', ' ').upper()} DIET ONLY")

    random_seed = uuid.uuid4().hex

    # Try to get some real food data for grounding
    real_foods_data = await fetch_real_foods_from_usda("high protein muscle building foods")
    food_context = ""
    if real_foods_data:
        food_context = f"\nReal food data from USDA for reference:\n{json.dumps(real_foods_data[:3], indent=2)}"

    prompt = f"""You are an expert sports nutritionist and dietitian. Create a detailed, personalized daily diet plan.

IMPORTANT: Ensure this generation is completely novel and unique compared to standard boilerplate plans. Here is a high-entropy seed to guarantee variation: {random_seed}

USER PROFILE:
- Age: {user_data.get('age')} years
- Weight: {user_data.get('weight_kg')} kg
- Height: {user_data.get('height_cm')} cm
- Gender: {user_data.get('gender')}
- Goal: {user_data.get('goal').replace('_', ' ')}
- Activity Level: {user_data.get('activity_level').replace('_', ' ')}

CALCULATED TARGETS:
- Daily Calories: {targets['target_calories']} kcal
- Protein: {targets['protein_g']}g
- Carbohydrates: {targets['carbs_g']}g
- Fat: {targets['fat_g']}g
{food_context}

PREFERENCES:
- Dietary restrictions: {', '.join(dietary_restrictions) if dietary_restrictions else 'None'}
- Preferred foods: {', '.join(preferred_foods) if preferred_foods else 'No preference'}

Create EXACTLY 5 meals (breakfast, mid-morning snack, lunch, evening snack, dinner) that:
1. Hit the macro targets accurately
2. Use real, commonly available Indian/International foods
3. Include preparation notes
4. Are practical for a sedentary office worker

Respond ONLY with a valid JSON object with this structure:
{{
  "title": "Personalized Muscle Gain Diet Plan",
  "notes": "Brief overall guidance (2-3 sentences)",
  "meals": [
    {{
      "meal_number": 1,
      "meal_name": "Breakfast",
      "time_suggestion": "7:00 AM - 8:00 AM",
      "items": [
        {{
          "name": "Food item name",
          "quantity": "e.g. 100g / 2 eggs / 1 cup",
          "calories": 200,
          "protein_g": 15.0,
          "carbs_g": 20.0,
          "fat_g": 5.0
        }}
      ],
      "total_calories": 400,
      "total_protein_g": 30.0,
      "total_carbs_g": 45.0,
      "total_fat_g": 10.0,
      "preparation_notes": "How to prepare this meal"
    }}
  ]
}}"""

    return await generate_structured_plan(
        prompt,
        lambda: build_local_diet_plan(user_data, targets, preferences),
    )

async def generate_workout_plan(
    user_data: Dict[str, Any],
    preferences: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Generate a personalized weekly workout plan."""

    workout_days = preferences.get("workout_days_per_week", 4) if preferences else 4
    equipment = preferences.get("available_equipment", []) if preferences else []

    random_seed = uuid.uuid4().hex

    prompt = f"""You are an expert certified personal trainer. Create a detailed, personalized weekly workout plan.

IMPORTANT: Ensure this program contains a unique, creative, and completely novel sequence of exercises. DO NOT repeat standard boilerplate routines. Use this high-entropy seed to guarantee massive variation while retaining effectiveness: {random_seed}

USER PROFILE:
- Age: {user_data.get('age')} years
- Weight: {user_data.get('weight_kg')} kg  
- Height: {user_data.get('height_cm')} cm
- Gender: {user_data.get('gender')}
- Goal: {user_data.get('goal').replace('_', ' ')}
- Activity Level: {user_data.get('activity_level').replace('_', ' ')} (desk job)
- Workout days per week: {workout_days}
- Available equipment: {', '.join(equipment) if equipment else 'Basic gym equipment'}

Create a {workout_days}-day per week workout program that:
1. Matches the primary goal
2. Is appropriate for someone with sedentary lifestyle transitioning into training
3. Includes warm-up and cool-down
4. Has realistic sets/reps for a beginner-intermediate

Respond ONLY with a valid JSON object:
{{
  "title": "12-Week Muscle Building Program",
  "notes": "Brief program overview and key principles",
  "focus_muscles": ["chest", "back", "legs", "shoulders", "arms"],
  "equipment_needed": ["barbell", "dumbbells", "cable machine"],
  "total_weekly_sets": 80,
  "weekly_schedule": {{
    "monday": {{
      "session_name": "Push Day (Chest, Shoulders, Triceps)",
      "duration_minutes": 60,
      "exercises": [
        {{
          "name": "Barbell Bench Press",
          "muscle_group": "Chest",
          "sets": 4,
          "reps": "8-10",
          "rest_seconds": 90,
          "notes": "Keep shoulder blades retracted",
          "is_compound": true
        }}
      ],
      "warm_up": "5 min light cardio + dynamic stretching",
      "cool_down": "5 min stretching"
    }},
    "tuesday": {{"rest": true, "session_name": "Rest / Active Recovery", "activities": ["light walk", "stretching"]}},
    "wednesday": {{"session_name": "Pull Day", "duration_minutes": 60, "exercises": []}},
    "thursday": {{"rest": true, "session_name": "Rest / Active Recovery", "activities": ["mobility"]}},
    "friday": {{"session_name": "Leg Day", "duration_minutes": 65, "exercises": []}},
    "saturday": {{"session_name": "Conditioning", "duration_minutes": 40, "exercises": []}},
    "sunday": {{"rest": true, "session_name": "Rest / Active Recovery", "activities": ["walk"]}}
  }}
}}"""
    return await generate_structured_plan(
        prompt,
        lambda: build_local_workout_plan(user_data, preferences),
    )
