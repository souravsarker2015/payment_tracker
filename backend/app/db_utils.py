"""
Database utility functions
"""
from sqlmodel import Session, text
from .database import engine

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
