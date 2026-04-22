"""add recommendation tables

Revision ID: c4b1d9a7e2f1
Revises: 69f0d855501c
Create Date: 2026-04-21 15:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c4b1d9a7e2f1"
down_revision: Union[str, None] = "69f0d855501c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recommendation_dataset_rows",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("height_cm", sa.Float(), nullable=False),
        sa.Column("gender", sa.String(), nullable=False),
        sa.Column("goal", sa.String(), nullable=False),
        sa.Column("activity_level", sa.String(), nullable=False),
        sa.Column("dietary_preference", sa.String(), nullable=False),
        sa.Column("workout_days_per_week", sa.Integer(), nullable=False),
        sa.Column("equipment_profile", sa.String(), nullable=False),
        sa.Column("diet_strategy", sa.String(), nullable=False),
        sa.Column("target_calories", sa.Integer(), nullable=False),
        sa.Column("protein_g", sa.Float(), nullable=False),
        sa.Column("carbs_g", sa.Float(), nullable=False),
        sa.Column("fat_g", sa.Float(), nullable=False),
        sa.Column("workout_strategy", sa.String(), nullable=False),
        sa.Column("total_weekly_sets", sa.Integer(), nullable=False),
        sa.Column("session_duration_min", sa.Integer(), nullable=False),
        sa.Column("focus_muscles", sa.JSON(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recommendation_dataset_rows_id"), "recommendation_dataset_rows", ["id"], unique=False)
    op.create_index(op.f("ix_recommendation_dataset_rows_gender"), "recommendation_dataset_rows", ["gender"], unique=False)
    op.create_index(op.f("ix_recommendation_dataset_rows_goal"), "recommendation_dataset_rows", ["goal"], unique=False)
    op.create_index(op.f("ix_recommendation_dataset_rows_activity_level"), "recommendation_dataset_rows", ["activity_level"], unique=False)
    op.create_index(op.f("ix_recommendation_dataset_rows_dietary_preference"), "recommendation_dataset_rows", ["dietary_preference"], unique=False)

    op.create_table(
        "plan_recommendations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("model_name", sa.String(), nullable=False),
        sa.Column("model_version", sa.String(), nullable=False),
        sa.Column("feature_snapshot", sa.JSON(), nullable=False),
        sa.Column("diet_prediction", sa.JSON(), nullable=False),
        sa.Column("workout_prediction", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_plan_recommendations_id"), "plan_recommendations", ["id"], unique=False)
    op.create_index(op.f("ix_plan_recommendations_user_id"), "plan_recommendations", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_plan_recommendations_user_id"), table_name="plan_recommendations")
    op.drop_index(op.f("ix_plan_recommendations_id"), table_name="plan_recommendations")
    op.drop_table("plan_recommendations")

    op.drop_index(op.f("ix_recommendation_dataset_rows_dietary_preference"), table_name="recommendation_dataset_rows")
    op.drop_index(op.f("ix_recommendation_dataset_rows_activity_level"), table_name="recommendation_dataset_rows")
    op.drop_index(op.f("ix_recommendation_dataset_rows_goal"), table_name="recommendation_dataset_rows")
    op.drop_index(op.f("ix_recommendation_dataset_rows_gender"), table_name="recommendation_dataset_rows")
    op.drop_index(op.f("ix_recommendation_dataset_rows_id"), table_name="recommendation_dataset_rows")
    op.drop_table("recommendation_dataset_rows")
