"""
Database utility functions
"""
from sqlmodel import Session, text
from alembic.config import Config
from alembic import command
import os
from .database import engine

def apply_migrations():
    """
    Apply Alembic migrations programmatically.
    Bypasses alembic.ini ConfigParser to avoid issues with special characters
    (e.g., '%') in DATABASE_URL passwords (common with Supabase).
    """
    try:
        # Get the path to backend directory (parent of app/)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ini_path = os.path.join(base_dir, "alembic.ini")

        # Load config from alembic.ini but do NOT let it parse the URL
        # (ConfigParser chokes on '%' in passwords)
        alembic_cfg = Config()
        alembic_cfg.set_main_option("script_location", os.path.join(base_dir, "alembic"))

        # Inject the DATABASE_URL directly, bypassing alembic.ini interpolation
        db_url = os.environ.get("DATABASE_URL", "")
        if db_url:
            alembic_cfg.set_main_option("sqlalchemy.url", db_url)
        else:
            # Fallback: read from ini directly if no env var
            alembic_cfg = Config(ini_path)

        print("🚀 Applying database migrations...")
        command.upgrade(alembic_cfg, "head")
        print("✅ Database migrations applied successfully")
    except Exception as e:
        print(f"⚠️  Database migration failed: {e}")

def fix_sequences():
    """
    Fix PostgreSQL sequences for all tables.
    This ensures auto-increment IDs work correctly after data imports.
    """
    tables = [
        # 'user', 'creditor', 'transaction', 'debtor', 'debtortransaction',
        # 'contributor', 'contributortransaction', 'expense_type', 'expense',
        # 'pond', 'supplier', 'unit', 'pondfeed', 'laborcost', 'fishsale',
        # 'fishsaleitem', 'person', 'organization', 
        'income'
    ]
    
    try:
        with Session(engine) as session:
            for table in tables:
                try:
                    # Get sequence name
                    result = session.exec(text(
                        f"SELECT pg_get_serial_sequence('{table}', 'id')"
                    )).first()
                    
                    if result and result[0]:
                        sequence_name = result[0]
                        # Reset sequence to max ID
                        session.exec(text(
                            f"SELECT setval('{sequence_name}', "
                            f"COALESCE((SELECT MAX(id) FROM {table}), 1), true);"
                        ))
                except Exception:
                    # Skip tables that don't exist or don't have sequences
                    pass
            session.commit()
            print("✅ Database sequences synchronized")
        # Session is automatically closed here
    except Exception as e:
        print(f"⚠️  Sequence sync skipped: {e}")
