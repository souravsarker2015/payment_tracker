from sqlmodel import Session, select, create_engine
from app.models.fish_farming import FishSale, FishSaleItem
from datetime import datetime

sqlite_url = "sqlite:///./backend/database.db"
engine = create_engine(sqlite_url)

def test_update():
    with Session(engine) as session:
        # 1. Create a sale
        sale = FishSale(
            date=datetime.now(),
            buyer_name="Test Update",
            sale_type="detailed",
            total_amount=100,
            user_id=1
        )
        session.add(sale)
        session.commit()
        session.refresh(sale)
        print(f"Created sale {sale.id}")
        
        # 2. Add items
        item = FishSaleItem(
            sale_id=sale.id,
            pond_id=1,
            quantity=10,
            unit_id=1,
            rate_per_unit=10,
            amount=100
        )
        session.add(item)
        session.commit()
        
        # Verify items
        session.refresh(sale)
        print(f"Sale {sale.id} has {len(sale.items)} items")
        
        # 3. Simulate Update: Delete and Add
        # Delete existing
        existing_items = session.exec(
            select(FishSaleItem).where(FishSaleItem.sale_id == sale.id)
        ).all()
        for item in existing_items:
            session.delete(item)
        
        # Add new
        new_item = FishSaleItem(
            sale_id=sale.id,
            pond_id=1,
            quantity=20,
            unit_id=1,
            rate_per_unit=10,
            amount=200
        )
        session.add(new_item)
        
        session.commit()
        
        # Verify
        session.refresh(sale)
        print(f"After update: Sale {sale.id} has {len(sale.items)} items")
        if len(sale.items) > 0:
            print(f"Item quantity: {sale.items[0].quantity}")
        else:
            print("ERROR: No items found after update!")

if __name__ == "__main__":
    test_update()
