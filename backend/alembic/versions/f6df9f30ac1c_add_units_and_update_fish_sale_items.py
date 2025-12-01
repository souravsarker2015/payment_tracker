"""add_units_and_update_fish_sale_items

Revision ID: f6df9f30ac1c
Revises: 477b3d43fa5a
Create Date: 2025-12-01 21:00:09.722899

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6df9f30ac1c'
down_revision: Union[str, Sequence[str], None] = '477b3d43fa5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop and recreate fishsaleitem table with new schema (simpler for SQLite)
    op.drop_table('fishsaleitem')
    op.create_table('fishsaleitem',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sale_id', sa.Integer(), nullable=False),
        sa.Column('pond_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('rate_per_unit', sa.Float(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['pond_id'], ['pond.id'], ),
        sa.ForeignKeyConstraint(['sale_id'], ['fishsale.id'], ),
        sa.ForeignKeyConstraint(['unit_id'], ['unit.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('fishsaleitem')
    op.create_table('fishsaleitem',
        sa.Column('id', sa.INTEGER(), nullable=False),
        sa.Column('sale_id', sa.INTEGER(), nullable=False),
        sa.Column('pond_id', sa.INTEGER(), nullable=False),
        sa.Column('weight_kg', sa.FLOAT(), nullable=False),
        sa.Column('rate_per_kg', sa.FLOAT(), nullable=False),
        sa.Column('amount', sa.FLOAT(), nullable=False),
        sa.ForeignKeyConstraint(['pond_id'], ['pond.id'], ),
        sa.ForeignKeyConstraint(['sale_id'], ['fishsale.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
