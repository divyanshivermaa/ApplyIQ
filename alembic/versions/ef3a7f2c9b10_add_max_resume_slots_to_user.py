"""add max_resume_slots to user

Revision ID: ef3a7f2c9b10
Revises: 9f7a2e4c1b6d
Create Date: 2026-03-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "ef3a7f2c9b10"
down_revision: Union[str, None] = "9f7a2e4c1b6d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("max_resume_slots", sa.Integer(), nullable=False, server_default="3"),
    )
    op.alter_column("user", "max_resume_slots", server_default=None)


def downgrade() -> None:
    op.drop_column("user", "max_resume_slots")
