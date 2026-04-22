CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    username VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    age INTEGER,
    weight_kg FLOAT,
    height_cm FLOAT,
    gender VARCHAR,
    goal VARCHAR,
    activity_level VARCHAR,
    dietary_preference VARCHAR,
    bmr FLOAT,
    tdee FLOAT,
    target_calories INTEGER,
    target_protein_g FLOAT,
    target_carbs_g FLOAT,
    target_fat_g FLOAT,
    is_active BOOLEAN DEFAULT 1,
    is_onboarded BOOLEAN DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE diet_plans (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR,
    total_calories INTEGER,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    meals JSON,
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE workout_plans (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR,
    weekly_schedule JSON,
    total_weekly_sets INTEGER,
    focus_muscles JSON,
    equipment_needed JSON,
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE progress_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    log_date DATETIME,
    weight_kg FLOAT,
    calories_consumed INTEGER,
    protein_consumed_g FLOAT,
    workout_completed BOOLEAN DEFAULT 0,
    workout_duration_min INTEGER,
    notes TEXT,
    mood_score INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE food_items (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    diet_category VARCHAR NOT NULL,
    calories_per_100g FLOAT NOT NULL,
    protein_per_100g FLOAT NOT NULL,
    carbs_per_100g FLOAT NOT NULL,
    fat_per_100g FLOAT NOT NULL,
    fiber_g FLOAT,
    sugar_g FLOAT,
    sodium_mg FLOAT,
    cholesterol_mg FLOAT,
    description VARCHAR,
    source_url VARCHAR
);

CREATE TABLE recommendation_dataset_rows (
    id INTEGER PRIMARY KEY,
    age INTEGER NOT NULL,
    weight_kg FLOAT NOT NULL,
    height_cm FLOAT NOT NULL,
    gender VARCHAR NOT NULL,
    goal VARCHAR NOT NULL,
    activity_level VARCHAR NOT NULL,
    dietary_preference VARCHAR NOT NULL,
    workout_days_per_week INTEGER NOT NULL,
    equipment_profile VARCHAR NOT NULL,
    diet_strategy VARCHAR NOT NULL,
    target_calories INTEGER NOT NULL,
    protein_g FLOAT NOT NULL,
    carbs_g FLOAT NOT NULL,
    fat_g FLOAT NOT NULL,
    workout_strategy VARCHAR NOT NULL,
    total_weekly_sets INTEGER NOT NULL,
    session_duration_min INTEGER NOT NULL,
    focus_muscles JSON NOT NULL,
    source VARCHAR NOT NULL,
    created_at DATETIME
);

CREATE TABLE plan_recommendations (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    model_name VARCHAR NOT NULL,
    model_version VARCHAR NOT NULL,
    feature_snapshot JSON NOT NULL,
    diet_prediction JSON NOT NULL,
    workout_prediction JSON NOT NULL,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
