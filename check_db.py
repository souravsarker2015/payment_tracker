from sqlmodel import Session, select, create_engine
from app.models.fish_farming import FishSale

sqlite_url = "sqlite:///./backend/database.db"
engine = create_engine(sqlite_url)

def check_sales():
    with Session(engine) as session:
        sales = session.exec(select(FishSale)).all()
        print(f"Found {len(sales)} sales")
        for sale in sales:
            print(f"Sale {sale.id}: type={sale.sale_type}, items={len(sale.items)}, weight={sale.total_weight}")

if __name__ == "__main__":
    check_sales()
