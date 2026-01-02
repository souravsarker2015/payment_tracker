"""description of changes

Revision ID: 13d86d911c52
Revises: 64c8187148d1
Create Date: 2026-01-02 18:45:13.079816

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '13d86d911c52'
down_revision: Union[str, Sequence[str], None] = '64c8187148d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('fish', schema=None) as batch_op:
        batch_op.alter_column('category_id',
                   existing_type=sa.INTEGER(),
                   nullable=True)
    
    with op.batch_alter_table('fishsaleitem', schema=None) as batch_op:
        batch_op.add_column(sa.Column('fish_id', sa.Integer(), nullable=True))
        batch_op.alter_column('pond_id',
                   existing_type=sa.INTEGER(),
                   nullable=True)
        batch_op.create_foreign_key('fk_fishsaleitem_fish', 'fish', ['fish_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('fishsaleitem', schema=None) as batch_op:
        batch_op.drop_constraint('fk_fishsaleitem_fish', type_='foreignkey')
        batch_op.alter_column('pond_id',
                   existing_type=sa.INTEGER(),
                   nullable=False)
        batch_op.drop_column('fish_id')
    
    with op.batch_alter_table('fish', schema=None) as batch_op:
        batch_op.alter_column('category_id',
                   existing_type=sa.INTEGER(),
                   nullable=False)
