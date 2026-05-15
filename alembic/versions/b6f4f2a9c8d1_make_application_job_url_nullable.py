"""make application job url nullable

Revision ID: b6f4f2a9c8d1
Revises: ef3a7f2c9b10
Create Date: 2026-05-15 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b6f4f2a9c8d1"
down_revision: Union[str, None] = "ef3a7f2c9b10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "application",
        "job_url",
        existing_type=sa.String(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "application",
        "job_url",
        existing_type=sa.String(),
        nullable=False,
    )
