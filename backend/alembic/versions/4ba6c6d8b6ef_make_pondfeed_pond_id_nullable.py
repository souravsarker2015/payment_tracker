"""make_pondfeed_pond_id_nullable

Revision ID: 4ba6c6d8b6ef
Revises: 13d86d911c52
Create Date: 2026-01-02 20:18:16.283490

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ba6c6d8b6ef'
down_revision: Union[str, Sequence[str], None] = '13d86d911c52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('pondfeed', schema=None) as batch_op:
        batch_op.alter_column('pond_id',
                   existing_type=sa.INTEGER(),
                   nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('pondfeed', schema=None) as batch_op:
        batch_op.alter_column('pond_id',
                   existing_type=sa.INTEGER(),
                   nullable=False)
