from __future__ import annotations

from random import Random
from typing import Any, Dict, List, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recommendation import PlanRecommendation, RecommendationDatasetRow
from app.models.user import User
from app.services.ai_service import calculate_bmr, calculate_targets, calculate_tdee

try:
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    from sklearn.feature_extraction import DictVectorizer
    from sklearn.pipeline import Pipeline

    SKLEARN_AVAILABLE = True
except ImportError:
    from app.services.simple_random_forest import RandomForestClassifier, RandomForestRegressor

    SKLEARN_AVAILABLE = False


MODEL_NAME = "random_forest"
MODEL_VERSION = "fitai-rf-v1"
SEED_SOURCE = "seed_random_forest_v1"
RNG_SEED = 42
_MODEL_CACHE: Dict[str, Any] = {"signature": None, "models": None}

DIET_STRATEGY_LABELS = {
    "high_protein_non_veg": "High Protein Non-Veg",
    "high_protein_veg": "High Protein Veg",
    "plant_performance": "Plant Performance",
    "fat_loss_high_fiber": "Fat Loss High Fiber",
    "balanced_recomp": "Balanced Recomp",
    "endurance_fuel": "Endurance Fuel",
}

WORKOUT_STRATEGY_LABELS = {
    "full_body_foundation": "Full Body Foundation",
    "upper_lower_progression": "Upper Lower Progression",
    "push_pull_legs": "Push Pull Legs",
    "conditioning_hybrid": "Conditioning Hybrid",
    "endurance_builder": "Endurance Builder",
}

WORKOUT_FOCUS_MUSCLES = {
    "full_body_foundation": ["chest", "back", "legs", "core"],
    "upper_lower_progression": ["chest", "back", "legs", "shoulders"],
    "push_pull_legs": ["chest", "back", "legs", "shoulders", "arms"],
    "conditioning_hybrid": ["legs", "core", "shoulders", "conditioning"],
    "endurance_builder": ["legs", "core", "glutes", "conditioning"],
}


def _round_float(value: float) -> float:
    return round(float(value), 1)


def _clamp_int(value: float, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, int(round(value))))


def _resolve_equipment_profile(equipment: List[str]) -> str:
    lowered = [item.strip().lower() for item in equipment if item and item.strip()]
    if not lowered:
        return "gym"

    gym_keywords = {"barbell", "cable", "smith", "lat pulldown", "leg press", "gym"}
    if any(keyword in item for item in lowered for keyword in gym_keywords):
        return "gym"
    return "home"


def _diet_strategy(goal: str, dietary_preference: str, activity_level: str) -> str:
    if dietary_preference == "vegan":
        return "plant_performance" if goal in {"muscle_gain", "endurance"} else "balanced_recomp"
    if goal == "weight_loss":
        return "fat_loss_high_fiber"
    if goal == "endurance":
        return "endurance_fuel"
    if goal == "muscle_gain":
        return "high_protein_veg" if dietary_preference == "veg" else "high_protein_non_veg"
    if activity_level == "very_active":
        return "endurance_fuel"
    return "balanced_recomp"


def _workout_strategy(goal: str, workout_days_per_week: int, equipment_profile: str) -> str:
    if goal == "endurance":
        return "endurance_builder"
    if goal == "weight_loss":
        return "conditioning_hybrid" if workout_days_per_week >= 4 else "full_body_foundation"
    if workout_days_per_week >= 5 and equipment_profile == "gym":
        return "push_pull_legs"
    if workout_days_per_week >= 4:
        return "upper_lower_progression"
    return "full_body_foundation"


def _feature_dict(payload: Dict[str, Any]) -> Dict[str, Any]:
    height_m = max(payload["height_cm"] / 100.0, 1.0)
    bmi = payload["weight_kg"] / (height_m * height_m)
    return {
        "age": payload["age"],
        "weight_kg": payload["weight_kg"],
        "height_cm": payload["height_cm"],
        "bmi": round(bmi, 2),
        "gender": payload["gender"],
        "goal": payload["goal"],
        "activity_level": payload["activity_level"],
        "dietary_preference": payload["dietary_preference"],
        "workout_days_per_week": payload["workout_days_per_week"],
        "equipment_profile": payload["equipment_profile"],
    }


def _build_seed_rows() -> List[RecommendationDatasetRow]:
    rng = Random(RNG_SEED)
    rows: List[RecommendationDatasetRow] = []

    genders = ["male", "female"]
    goals = ["weight_loss", "muscle_gain", "maintain", "endurance"]
    activities = ["sedentary", "lightly_active", "moderately_active", "very_active"]
    diets = ["veg", "non_veg", "vegan"]
    workout_days = [3, 4, 5, 6]
    equipment_profiles = ["home", "gym"]

    for gender in genders:
        for goal in goals:
            for activity_level in activities:
                for dietary_preference in diets:
                    for days in workout_days:
                        for equipment_profile in equipment_profiles:
                            for variant in range(2):
                                age = rng.randint(18, 58)
                                height_cm = rng.uniform(150.0, 192.0)
                                bmi_low = 19.0 if goal != "weight_loss" else 24.0
                                bmi_high = 31.0 if goal == "muscle_gain" else 28.0
                                bmi = rng.uniform(bmi_low, bmi_high)
                                weight_kg = bmi * ((height_cm / 100.0) ** 2)

                                bmr = calculate_bmr(weight_kg, height_cm, age, gender)
                                tdee = calculate_tdee(bmr, activity_level)
                                targets = calculate_targets(tdee, goal, weight_kg)

                                calories = targets["target_calories"] + (days - 4) * 65 + (30 if equipment_profile == "gym" else 0)
                                if variant == 1:
                                    calories += 45 if activity_level in {"moderately_active", "very_active"} else -25

                                protein = targets["protein_g"] + (0.12 * weight_kg if goal == "muscle_gain" else 0.0)
                                if dietary_preference == "vegan":
                                    protein -= 4.0
                                elif dietary_preference == "non_veg":
                                    protein += 3.0

                                fat = targets["fat_g"] + (2.5 if goal == "endurance" else 0.0)
                                if goal == "weight_loss":
                                    fat -= 3.0
                                carbs = (calories - protein * 4 - fat * 9) / 4

                                diet_strategy = _diet_strategy(goal, dietary_preference, activity_level)
                                workout_strategy = _workout_strategy(goal, days, equipment_profile)
                                weekly_sets = 32 + (days * 7) + (10 if goal == "muscle_gain" else 0) - (4 if goal == "endurance" else 0)
                                if workout_strategy == "push_pull_legs":
                                    weekly_sets += 8
                                if variant == 1:
                                    weekly_sets += 3

                                session_duration = 42 + days * 4 + (6 if goal == "endurance" else 0)
                                if equipment_profile == "home":
                                    session_duration -= 4

                                rows.append(
                                    RecommendationDatasetRow(
                                        age=age,
                                        weight_kg=round(weight_kg, 1),
                                        height_cm=round(height_cm, 1),
                                        gender=gender,
                                        goal=goal,
                                        activity_level=activity_level,
                                        dietary_preference=dietary_preference,
                                        workout_days_per_week=days,
                                        equipment_profile=equipment_profile,
                                        diet_strategy=diet_strategy,
                                        target_calories=_clamp_int(calories, 1400, 4200),
                                        protein_g=_round_float(max(75.0, protein)),
                                        carbs_g=_round_float(max(120.0, carbs)),
                                        fat_g=_round_float(max(35.0, fat)),
                                        workout_strategy=workout_strategy,
                                        total_weekly_sets=_clamp_int(weekly_sets, 24, 120),
                                        session_duration_min=_clamp_int(session_duration, 35, 95),
                                        focus_muscles=WORKOUT_FOCUS_MUSCLES[workout_strategy],
                                        source=SEED_SOURCE,
                                    )
                                )
    return rows


async def ensure_seed_dataset(db: AsyncSession) -> int:
    existing = await db.scalar(select(func.count(RecommendationDatasetRow.id)))
    if existing:
        return int(existing)

    rows = _build_seed_rows()
    db.add_all(rows)
    await db.flush()
    return len(rows)


def _rows_to_features(rows: List[RecommendationDatasetRow]) -> List[Dict[str, Any]]:
    return [
        _feature_dict(
            {
                "age": row.age,
                "weight_kg": row.weight_kg,
                "height_cm": row.height_cm,
                "gender": row.gender,
                "goal": row.goal,
                "activity_level": row.activity_level,
                "dietary_preference": row.dietary_preference,
                "workout_days_per_week": row.workout_days_per_week,
                "equipment_profile": row.equipment_profile,
            }
        )
        for row in rows
    ]


def _train_random_forest_models(rows: List[RecommendationDatasetRow]) -> Dict[str, Any]:
    features = _rows_to_features(rows)
    if SKLEARN_AVAILABLE:
        def regressor() -> Pipeline:
            return Pipeline(
                [
                    ("vectorizer", DictVectorizer(sparse=False)),
                    ("model", RandomForestRegressor(n_estimators=120, random_state=RNG_SEED, min_samples_leaf=2)),
                ]
            )

        def classifier() -> Pipeline:
            return Pipeline(
                [
                    ("vectorizer", DictVectorizer(sparse=False)),
                    ("model", RandomForestClassifier(n_estimators=120, random_state=RNG_SEED, min_samples_leaf=2)),
                ]
            )
    else:
        def regressor() -> RandomForestRegressor:
            return RandomForestRegressor(n_estimators=40, max_depth=6, min_samples_split=6, min_samples_leaf=2, random_state=RNG_SEED)

        def classifier() -> RandomForestClassifier:
            return RandomForestClassifier(n_estimators=40, max_depth=6, min_samples_split=6, min_samples_leaf=2, random_state=RNG_SEED)

    models: Dict[str, Any] = {
        "diet_calories": regressor(),
        "diet_protein": regressor(),
        "diet_carbs": regressor(),
        "diet_fat": regressor(),
        "diet_strategy": classifier(),
        "workout_strategy": classifier(),
        "workout_sets": regressor(),
        "workout_duration": regressor(),
    }

    models["diet_calories"].fit(features, [row.target_calories for row in rows])
    models["diet_protein"].fit(features, [row.protein_g for row in rows])
    models["diet_carbs"].fit(features, [row.carbs_g for row in rows])
    models["diet_fat"].fit(features, [row.fat_g for row in rows])
    models["diet_strategy"].fit(features, [row.diet_strategy for row in rows])
    models["workout_strategy"].fit(features, [row.workout_strategy for row in rows])
    models["workout_sets"].fit(features, [row.total_weekly_sets for row in rows])
    models["workout_duration"].fit(features, [row.session_duration_min for row in rows])
    return models


async def build_plan_recommendation(
    db: AsyncSession,
    current_user: User,
    preferences: Dict[str, Any],
) -> PlanRecommendation:
    await ensure_seed_dataset(db)

    feature_snapshot = _feature_dict(
        {
            "age": current_user.age or 25,
            "weight_kg": current_user.weight_kg or 70.0,
            "height_cm": current_user.height_cm or 170.0,
            "gender": current_user.gender.value if hasattr(current_user.gender, "value") else (current_user.gender or "male"),
            "goal": current_user.goal.value if hasattr(current_user.goal, "value") else (current_user.goal or "maintain"),
            "activity_level": current_user.activity_level.value if hasattr(current_user.activity_level, "value") else (current_user.activity_level or "sedentary"),
            "dietary_preference": current_user.dietary_preference.value if hasattr(current_user.dietary_preference, "value") else (current_user.dietary_preference or "non_veg"),
            "workout_days_per_week": max(2, min(7, int(preferences.get("workout_days_per_week") or 4))),
            "equipment_profile": _resolve_equipment_profile(preferences.get("available_equipment", [])),
        }
    )

    dataset_count = await ensure_seed_dataset(db)
    cache_signature = (dataset_count, SKLEARN_AVAILABLE)
    if _MODEL_CACHE["signature"] != cache_signature:
        rows = (await db.execute(select(RecommendationDatasetRow))).scalars().all()
        _MODEL_CACHE["models"] = _train_random_forest_models(rows)
        _MODEL_CACHE["signature"] = cache_signature

    models = _MODEL_CACHE["models"]
    prediction_input = [feature_snapshot]
    diet_strategy = models["diet_strategy"].predict(prediction_input)[0]
    workout_strategy = models["workout_strategy"].predict(prediction_input)[0]
    diet_prediction = {
        "diet_strategy": diet_strategy,
        "diet_strategy_label": DIET_STRATEGY_LABELS.get(diet_strategy, diet_strategy.replace("_", " ").title()),
        "targets": {
            "target_calories": _clamp_int(models["diet_calories"].predict(prediction_input)[0], 1400, 4200),
            "protein_g": _round_float(models["diet_protein"].predict(prediction_input)[0]),
            "carbs_g": _round_float(models["diet_carbs"].predict(prediction_input)[0]),
            "fat_g": _round_float(models["diet_fat"].predict(prediction_input)[0]),
        },
    }
    workout_prediction = {
        "workout_strategy": workout_strategy,
        "workout_strategy_label": WORKOUT_STRATEGY_LABELS.get(workout_strategy, workout_strategy.replace("_", " ").title()),
        "total_weekly_sets": _clamp_int(models["workout_sets"].predict(prediction_input)[0], 24, 120),
        "session_duration_min": _clamp_int(models["workout_duration"].predict(prediction_input)[0], 35, 95),
        "focus_muscles": WORKOUT_FOCUS_MUSCLES.get(workout_strategy, ["chest", "back", "legs", "core"]),
    }

    snapshot = PlanRecommendation(
        user_id=current_user.id,
        model_name=MODEL_NAME,
        model_version=MODEL_VERSION,
        feature_snapshot=feature_snapshot,
        diet_prediction=diet_prediction,
        workout_prediction=workout_prediction,
    )
    db.add(snapshot)
    await db.flush()
    return snapshot
