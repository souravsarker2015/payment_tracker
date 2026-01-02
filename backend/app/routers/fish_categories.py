from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import FishCategory

router = APIRouter(tags=["fish_categories"])

@router.post("/fish-categories", response_model=FishCategory)
def create_fish_category(
    category: FishCategory,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    category.user_id = current_user.id
    session.add(category)
    session.commit()
    session.refresh(category)
    return category

@router.get("/fish-categories", response_model=List[FishCategory])
def read_fish_categories(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(FishCategory).where(FishCategory.user_id == current_user.id)
    return session.exec(query).all()

@router.put("/fish-categories/{category_id}", response_model=FishCategory)
def update_fish_category(
    category_id: int,
    category_data: FishCategory,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_category = session.get(FishCategory, category_id)
    if not db_category or db_category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_category.name = category_data.name
    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category

@router.delete("/fish-categories/{category_id}")
def delete_fish_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    category = session.get(FishCategory, category_id)
    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")
    
    session.delete(category)
    session.commit()
    return {"ok": True}

@router.get("/fish-categories/{category_id}/stats")
def get_category_stats(
    category_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from app.models.fish_farming import Fish, FishSaleItem, FishSale
    from datetime import datetime
    
    # Verify category ownership
    category = session.get(FishCategory, category_id)
    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Parse dates if provided
    start_dt = None
    end_dt = None
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    # Get all fish in this category
    fish_query = select(Fish).where(Fish.category_id == category_id)
    fish_in_category = session.exec(fish_query).all()
    fish_ids = [f.id for f in fish_in_category]
    
    # Get all sale items for fish in this category
    sale_items_query = select(FishSaleItem).where(FishSaleItem.fish_id.in_(fish_ids))
    sale_items = session.exec(sale_items_query).all()
    
    # Filter by date range if specified
    filtered_items = []
    for item in sale_items:
        sale = session.get(FishSale, item.sale_id)
        if sale:
            include = True
            if start_dt and sale.date < start_dt:
                include = False
            if end_dt and sale.date > end_dt:
                include = False
            if include:
                filtered_items.append((item, sale))
    
    # Calculate totals
    total_sales = sum(item.amount for item, _ in filtered_items)
    total_quantity_sold = sum(item.quantity for item, _ in filtered_items)
    sales_count = len(set(item.sale_id for item, _ in filtered_items))
    
    # Get sales by date
    sales_by_date = {}
    for item, sale in filtered_items:
        date_key = sale.date.strftime("%Y-%m-%d")
        if date_key not in sales_by_date:
            sales_by_date[date_key] = {"amount": 0, "quantity": 0}
        sales_by_date[date_key]["amount"] += item.amount
        sales_by_date[date_key]["quantity"] += item.quantity
    
    # Get sales by fish
    sales_by_fish = {}
    for item, sale in filtered_items:
        fish = session.get(Fish, item.fish_id)
        if fish:
            if fish.name not in sales_by_fish:
                sales_by_fish[fish.name] = {"amount": 0, "quantity": 0, "sales_count": 0}
            sales_by_fish[fish.name]["amount"] += item.amount
            sales_by_fish[fish.name]["quantity"] += item.quantity
            sales_by_fish[fish.name]["sales_count"] += 1
    
    return {
        "category": {
            "id": category.id,
            "name": category.name
        },
        "total_sales": total_sales,
        "total_quantity_sold": total_quantity_sold,
        "sales_count": sales_count,
        "fish_count": len(fish_in_category),
        "sales_by_date": sales_by_date,
        "sales_by_fish": sales_by_fish,
        "start_date": start_date,
        "end_date": end_date
    }
