"""merge deployment heads

Revision ID: c7d8e9f0a1b2
Revises: a1b2c3d4e5f6, b6f4f2a9c8d1
Create Date: 2026-05-16 00:00:00.000000
"""

from typing import Sequence, Union


revision: str = "c7d8e9f0a1b2"
down_revision: Union[str, tuple[str, str], None] = ("a1b2c3d4e5f6", "b6f4f2a9c8d1")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
