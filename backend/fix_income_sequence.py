"""
Fix PostgreSQL sequence for income table
Run this script once to reset the sequence counter
"""
from sqlmodel import Session, create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    exit(1)

engine = create_engine(DATABASE_URL, echo=True)

def fix_income_sequence():
    with Session(engine) as session:
        # Reset the sequence to the max ID in the table
        session.exec(text(
            "SELECT setval(pg_get_serial_sequence('income', 'id'), "
            "COALESCE((SELECT MAX(id) FROM income), 1), true);"
        ))
        session.commit()
        print("✅ Income sequence fixed successfully!")

if __name__ == "__main__":
    print("Fixing income table sequence...")
    fix_income_sequence()
