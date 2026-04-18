from typing import Any, Dict, List, Optional, Tuple

MEAL_SCHEDULE = [
    ("Breakfast", "7:00 AM - 8:00 AM", 0.24),
    ("Mid-Morning Snack", "10:30 AM - 11:00 AM", 0.11),
    ("Lunch", "1:00 PM - 2:00 PM", 0.28),
    ("Evening Snack", "4:30 PM - 5:30 PM", 0.12),
    ("Dinner", "8:00 PM - 9:00 PM", 0.25),
]

WORKOUT_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

ACTIVE_DAY_PATTERNS = {
    2: {"monday", "thursday"},
    3: {"monday", "wednesday", "friday"},
    4: {"monday", "tuesday", "thursday", "friday"},
    5: {"monday", "tuesday", "wednesday", "friday", "saturday"},
    6: {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday"},
    7: {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"},
}

SPLITS = {
    "muscle_gain": ["Upper Strength", "Lower Strength", "Push", "Pull", "Legs", "Conditioning"],
    "weight_loss": ["Full Body", "Conditioning", "Upper Body", "Lower Body", "Circuit", "Cardio"],
    "maintain": ["Upper Body", "Lower Body", "Full Body", "Conditioning", "Pump", "Cardio"],
    "endurance": ["Aerobic Base", "Support Strength", "Intervals", "Stability", "Tempo", "Mobility"],
}

EXERCISES = {
    "home": {
        "upper": [("Push-Ups", "Chest", True), ("Band Row", "Back", True), ("Pike Push-Ups", "Shoulders", True), ("Band Curl", "Biceps", False)],
        "lower": [("Goblet Squat", "Legs", True), ("Reverse Lunge", "Glutes", True), ("Romanian Deadlift", "Hamstrings", True), ("Calf Raise", "Legs", False)],
        "core": [("Plank", "Core", False), ("Dead Bug", "Core", False)],
        "conditioning": [("Jump Rope", "Conditioning", False), ("Burpees", "Conditioning", False), ("Fast Step-Ups", "Conditioning", False)],
    },
    "gym": {
        "upper": [("Bench Press", "Chest", True), ("Lat Pulldown", "Back", True), ("Shoulder Press", "Shoulders", True), ("Cable Row", "Back", True)],
        "lower": [("Back Squat", "Legs", True), ("Romanian Deadlift", "Hamstrings", True), ("Leg Press", "Legs", True), ("Leg Curl", "Hamstrings", False)],
        "core": [("Cable Crunch", "Core", False), ("Hanging Knee Raise", "Core", False)],
        "conditioning": [("Bike Intervals", "Conditioning", False), ("Rower Intervals", "Conditioning", False), ("Incline Walk", "Conditioning", False)],
    },
}


def clamp_int(value: float) -> int:
    return max(0, int(round(value)))


def normalize_keywords(values: Optional[List[str]]) -> List[str]:
    return [value.strip().lower() for value in (values or []) if value and value.strip()]


def has_any_keyword(values: List[str], keywords: List[str]) -> bool:
    return any(keyword in value for value in values for keyword in keywords)


def meal_targets(targets: Dict[str, float], ratio: float) -> Dict[str, float]:
    return {
        "calories": round(targets["target_calories"] * ratio),
        "protein": round(targets["protein_g"] * ratio, 1),
        "carbs": round(targets["carbs_g"] * ratio, 1),
        "fat": round(targets["fat_g"] * ratio, 1),
    }


def allocate_items(total: Dict[str, float], spec: List[Tuple[str, str, float, float, float, float]]) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    used = {"calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}
    for index, (name, quantity, c_ratio, p_ratio, carb_ratio, f_ratio) in enumerate(spec):
        last = index == len(spec) - 1
        if last:
            calories = clamp_int(total["calories"] - used["calories"])
            protein = round(max(0.0, total["protein"] - used["protein"]), 1)
            carbs = round(max(0.0, total["carbs"] - used["carbs"]), 1)
            fat = round(max(0.0, total["fat"] - used["fat"]), 1)
        else:
            calories = clamp_int(total["calories"] * c_ratio)
            protein = round(total["protein"] * p_ratio, 1)
            carbs = round(total["carbs"] * carb_ratio, 1)
            fat = round(total["fat"] * f_ratio, 1)
            used["calories"] += calories
            used["protein"] += protein
            used["carbs"] += carbs
            used["fat"] += fat
        items.append({
            "name": name,
            "quantity": quantity,
            "calories": calories,
            "protein_g": protein,
            "carbs_g": carbs,
            "fat_g": fat,
        })
    return items


def build_local_diet_plan(user_data: Dict[str, Any], targets: Dict[str, float], preferences: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    restrictions = normalize_keywords((preferences or {}).get("dietary_restrictions"))
    preferred = normalize_keywords((preferences or {}).get("preferred_foods"))
    vegetarian = has_any_keyword(restrictions, ["vegetarian", "veg", "no meat"])
    vegan = has_any_keyword(restrictions, ["vegan", "dairy free", "dairy-free"])
    no_eggs = vegan or has_any_keyword(restrictions, ["egg free", "egg-free", "no egg"])

    breakfast_protein = "Tofu Scramble" if vegan else ("Paneer Bhurji" if vegetarian or no_eggs else "Masala Omelette")
    lunch_protein = "Tofu Tikka" if vegan else ("Paneer Tikka" if vegetarian else "Grilled Chicken")
    dinner_protein = "Soy Chunk Curry" if vegan else ("Dal + Paneer Bowl" if vegetarian else "Herb Chicken Bowl")

    if has_any_keyword(preferred, ["eggs", "egg"]) and not no_eggs:
        breakfast_protein = "Boiled Eggs + Egg White Toast"
    if has_any_keyword(preferred, ["paneer"]):
        lunch_protein = "Paneer Tikka"
        dinner_protein = "Paneer Rice Bowl"
    if has_any_keyword(preferred, ["tofu"]):
        breakfast_protein = "Tofu Scramble"
        lunch_protein = "Tofu Tikka"
        dinner_protein = "Tofu Stir Fry"
    if has_any_keyword(preferred, ["chicken"]):
        lunch_protein = "Grilled Chicken"
        dinner_protein = "Herb Chicken Bowl"

    dinner_carb = "Sauteed Vegetables" if user_data.get("goal") == "weight_loss" else "Jeera Rice"
    snack_carbs = "Banana + Dates" if user_data.get("goal") == "endurance" else "Banana Smoothie"

    blueprints = [
        [("Oats Bowl", "1 bowl", 0.44, 0.18, 0.50, 0.18), (breakfast_protein, "1 serving", 0.41, 0.60, 0.30, 0.56), ("Fruit + Seeds", "1 side bowl", 0.15, 0.22, 0.20, 0.26)],
        [("Protein Snack", "1 serving", 0.50, 0.68, 0.28, 0.34), ("Seasonal Fruit", "1 medium portion", 0.28, 0.10, 0.48, 0.08), ("Nuts", "1 small handful", 0.22, 0.22, 0.24, 0.58)],
        [(lunch_protein, "1 large serving", 0.38, 0.50, 0.18, 0.34), ("Rice or Roti", "1 serving", 0.32, 0.12, 0.52, 0.16), ("Dal or Beans", "1 cup", 0.18, 0.24, 0.18, 0.18), ("Salad + Curd", "1 bowl", 0.12, 0.14, 0.12, 0.32)],
        [(snack_carbs, "1 serving", 0.42, 0.16, 0.58, 0.12), ("Roasted Chana / Trail Mix", "1 serving", 0.34, 0.44, 0.24, 0.34), ("Hydration Add-On", "Coconut water or lemon water", 0.24, 0.40, 0.18, 0.54)],
        [(dinner_protein, "1 large serving", 0.42, 0.52, 0.18, 0.34), (dinner_carb, "1 serving", 0.26, 0.10, 0.48, 0.12), ("Sauteed Greens", "1 bowl", 0.14, 0.16, 0.12, 0.18), ("Curd / Soup", "1 small bowl", 0.18, 0.22, 0.22, 0.36)],
    ]
    preps = [
        "Prep the oats early, cook the protein fresh, and keep the fruit portion ready for a quick start.",
        "Keep this snack portable so you can stay consistent during work hours.",
        "Anchor lunch around protein, one measured carb, and enough fiber to keep energy steady.",
        "Use this snack to avoid late-evening cravings and support hydration.",
        "Keep dinner lighter on oils and finish eating a couple of hours before sleep.",
    ]

    meals = []
    for index, (schedule, spec, prep) in enumerate(zip(MEAL_SCHEDULE, blueprints, preps), start=1):
        meal_name, meal_time, ratio = schedule
        totals = meal_targets(targets, ratio)
        items = allocate_items(totals, spec)
        meals.append({
            "meal_number": index,
            "meal_name": meal_name,
            "time_suggestion": meal_time,
            "items": items,
            "total_calories": sum(item["calories"] for item in items),
            "total_protein_g": round(sum(item["protein_g"] for item in items), 1),
            "total_carbs_g": round(sum(item["carbs_g"] for item in items), 1),
            "total_fat_g": round(sum(item["fat_g"] for item in items), 1),
            "preparation_notes": prep,
        })

    preference_text = ", ".join(preferred[:3]) if preferred else "balanced everyday foods"
    restriction_text = ", ".join(restrictions) if restrictions else "none"
    return {
        "title": f"{user_data.get('goal', 'balanced').replace('_', ' ').title()} Daily Nutrition Blueprint",
        "notes": f"Generated by the local FitAI Brain using {preference_text} while respecting {restriction_text} restrictions and staying close to your calorie and macro targets.",
        "meals": meals,
    }


def make_exercise(name: str, muscle: str, compound: bool, goal: str) -> Dict[str, Any]:
    return {
        "name": name,
        "muscle_group": muscle,
        "sets": 4 if compound else 3,
        "reps": "6-10" if compound and goal == "muscle_gain" else "10-15",
        "rest_seconds": 90 if compound else 60,
        "notes": "Move with control and keep one or two reps in reserve.",
        "is_compound": compound,
    }


def build_session(name: str, library: Dict[str, List[Tuple[str, str, bool]]], goal: str) -> Dict[str, Any]:
    if name in {"Conditioning", "Cardio", "Intervals", "Tempo", "Aerobic Base", "Mobility"}:
        choices = library["conditioning"][:2] + library["core"][:2]
    elif name in {"Lower Strength", "Lower Body", "Legs", "Stability"}:
        choices = library["lower"][:4] + library["core"][:2]
    elif name in {"Upper Strength", "Upper Body", "Push", "Pull", "Support Strength", "Pump"}:
        choices = library["upper"][:4] + library["core"][:2]
    else:
        choices = library["upper"][:2] + library["lower"][:2] + library["core"][:2]

    exercises = [make_exercise(ex_name, muscle, compound, goal) for ex_name, muscle, compound in choices[:6]]
    return {
        "session_name": name,
        "duration_minutes": 45 + len(exercises) * 4,
        "exercises": exercises,
        "warm_up": "5 minutes easy cardio + dynamic mobility",
        "cool_down": "5 minutes relaxed walking and light stretching",
    }


def build_local_workout_plan(user_data: Dict[str, Any], preferences: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    prefs = preferences or {}
    goal = user_data.get("goal", "maintain")
    workout_days = max(2, min(7, int(prefs.get("workout_days_per_week") or 4)))
    equipment = normalize_keywords(prefs.get("available_equipment"))
    library = EXERCISES["home" if not equipment or has_any_keyword(equipment, ["home", "band", "bodyweight", "dumbbell"]) else "gym"]
    split = SPLITS.get(goal, SPLITS["maintain"])
    active_days = ACTIVE_DAY_PATTERNS[workout_days]

    weekly_schedule: Dict[str, Any] = {}
    focus_muscles: List[str] = []
    total_sets = 0
    index = 0
    for day in WORKOUT_WEEK:
        if day not in active_days:
            weekly_schedule[day] = {
                "rest": True,
                "session_name": "Rest / Active Recovery",
                "activities": ["10-20 minute walk", "mobility work", "hydration focus"],
            }
            continue
        session = build_session(split[index % len(split)], library, goal)
        weekly_schedule[day] = session
        total_sets += sum(exercise["sets"] for exercise in session["exercises"])
        focus_muscles.extend(exercise["muscle_group"].lower() for exercise in session["exercises"][:4])
        index += 1

    unique_focus = []
    for muscle in focus_muscles:
        if muscle not in unique_focus and muscle != "conditioning":
            unique_focus.append(muscle)

    return {
        "title": f"{workout_days}-Day {goal.replace('_', ' ').title()} Training System",
        "notes": "Generated by the local FitAI Brain with progressive overload, recovery spacing, and beginner-friendly exercise selection.",
        "focus_muscles": unique_focus[:6],
        "equipment_needed": equipment or ["adjustable dumbbells", "resistance bands", "bench or sturdy chair", "yoga mat"],
        "total_weekly_sets": total_sets,
        "weekly_schedule": weekly_schedule,
    }
