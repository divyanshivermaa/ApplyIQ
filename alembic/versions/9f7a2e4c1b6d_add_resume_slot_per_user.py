"""add resume slot per user

Revision ID: 9f7a2e4c1b6d
Revises: 31baf00dce9a
Create Date: 2026-03-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9f7a2e4c1b6d"
down_revision: Union[str, None] = "31baf00dce9a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) Add column as nullable first (so upgrade doesn't fail)
    op.add_column("resume", sa.Column("slot", sa.Integer(), nullable=True))

    # 2) Backfill slot for existing data (per user)
    op.execute(
        """
        WITH ranked AS (
          SELECT id, user_id,
                 ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id) AS rn
          FROM resume
        )
        UPDATE resume r
        SET slot = ranked.rn
        FROM ranked
        WHERE r.id = ranked.id;
        """
    )

    # 3) Make slot NOT NULL
    op.alter_column("resume", "slot", nullable=False)

    # 4) Add unique constraint (user_id, slot)
    op.create_unique_constraint(
        "uq_resume_user_slot",
        "resume",
        ["user_id", "slot"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_resume_user_slot", "resume", type_="unique")
    op.drop_column("resume", "slot")
