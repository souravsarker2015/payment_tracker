"""
Fix PostgreSQL sequences for all tables
Run this script to reset sequence counters for all tables with auto-increment IDs
"""
from sqlmodel import Session, create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    exit(1)

engine = create_engine(DATABASE_URL, echo=False)

# List of tables with auto-increment primary keys
TABLES = [
    'user',
    'creditor',
    'transaction',
    'debtor',
    'debtortransaction',
    'contributor',
    'contributortransaction',
    'expense_type',
    'expense',
    'pond',
    'supplier',
    'unit',
    'pondfeed',
    'laborcost',
    'fishsale',
    'fishsaleitem',
    'person',
    'organization',
    'income'
]

def fix_sequence(session: Session, table_name: str):
    try:
        # Get the sequence name for this table
        result = session.exec(text(
            f"SELECT pg_get_serial_sequence('{table_name}', 'id')"
        )).first()
        
        if result and result[0]:
            sequence_name = result[0]
            # Reset the sequence
            session.exec(text(
                f"SELECT setval('{sequence_name}', "
                f"COALESCE((SELECT MAX(id) FROM {table_name}), 1), true);"
            ))
            print(f"✅ Fixed sequence for table: {table_name}")
        else:
            print(f"⚠️  No sequence found for table: {table_name}")
    except Exception as e:
        print(f"❌ Error fixing sequence for {table_name}: {e}")

def fix_all_sequences():
    with Session(engine) as session:
        print("Starting sequence fix for all tables...\n")
        for table in TABLES:
            fix_sequence(session, table)
        session.commit()
        print("\n✅ All sequences fixed successfully!")

if __name__ == "__main__":
    fix_all_sequences()
