"""Remove Tour, LocalEvent, MapDestination plan types

Revision ID: remove_plan_types_0001
Revises: auth_phase2_0001
Create Date: 2026-06-08
"""
from typing import Sequence, Union

from alembic import op

revision: str = "remove_plan_types_0001"
down_revision: Union[str, None] = "auth_phase2_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_VALUES = ('Activity', 'Restaurant', 'Meeting', 'Flight', 'Hotel', 'Tour',
              'CarReservation', 'Cruise', 'Ferry', 'MapDestination', 'RailwayRide',
              'BusRide', 'LocalEvent')

NEW_VALUES = ('Activity', 'Restaurant', 'Meeting', 'Flight', 'Hotel',
              'CarReservation', 'Cruise', 'Ferry', 'RailwayRide', 'BusRide')


def upgrade() -> None:
    op.execute("ALTER TYPE plantype RENAME TO plantype_old")
    op.execute(f"CREATE TYPE plantype AS ENUM {NEW_VALUES}")
    op.execute(
        "ALTER TABLE plans ALTER COLUMN type TYPE plantype "
        "USING type::text::plantype"
    )
    op.execute("DROP TYPE plantype_old")


def downgrade() -> None:
    op.execute("ALTER TYPE plantype RENAME TO plantype_new")
    op.execute(f"CREATE TYPE plantype AS ENUM {OLD_VALUES}")
    op.execute(
        "ALTER TABLE plans ALTER COLUMN type TYPE plantype "
        "USING type::text::plantype"
    )
    op.execute("DROP TYPE plantype_new")
