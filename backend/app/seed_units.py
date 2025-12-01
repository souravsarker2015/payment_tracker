"""
Seed default units into the database
Run this after migration: python -m app.seed_units
"""
from sqlmodel import Session, select
from app.database import engine
from app.models.fish_farming import Unit

def seed_units():
    with Session(engine) as session:
        # Check if default units already exist
        existing = session.exec(select(Unit).where(Unit.is_default == True)).first()
        if existing:
            print("Default units already exist. Skipping seed.")
            return
        
        # Default units
        default_units = [
            Unit(name="kg", name_bn="কেজি", is_default=True, user_id=None),
            Unit(name="mon", name_bn="মণ", is_default=True, user_id=None),
            Unit(name="pcs", name_bn="পিস", is_default=True, user_id=None),
            Unit(name="ton", name_bn="টন", is_default=True, user_id=None),
        ]
        
        for unit in default_units:
            session.add(unit)
        
        session.commit()
        print(f"✅ Seeded {len(default_units)} default units")

if __name__ == "__main__":
    seed_units()
