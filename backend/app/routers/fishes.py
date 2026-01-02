from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import Fish, FishCategory

router = APIRouter(tags=["fishes"])

@router.post("/fishes", response_model=Fish)
def create_fish(
    fish: Fish,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Verify category exists if provided
    if fish.category_id:
        category = session.get(FishCategory, fish.category_id)
        if not category or category.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Category not found or access denied")
        
    fish.user_id = current_user.id
    session.add(fish)
    session.commit()
    session.refresh(fish)
    return fish

@router.get("/fishes", response_model=List[Fish])
def read_fishes(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(Fish).where(Fish.user_id == current_user.id)
    return session.exec(query).all()

@router.put("/fishes/{fish_id}", response_model=Fish)
def update_fish(
    fish_id: int,
    fish_data: Fish,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_fish = session.get(Fish, fish_id)
    if not db_fish or db_fish.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Fish not found")
    
    # Verify new category exists if changed and provided
    if fish_data.category_id != db_fish.category_id:
        if fish_data.category_id:
            category = session.get(FishCategory, fish_data.category_id)
            if not category or category.user_id != current_user.id:
                raise HTTPException(status_code=404, detail="Category not found or access denied")
        db_fish.category_id = fish_data.category_id

    db_fish.name = fish_data.name
    session.add(db_fish)
    session.commit()
    session.refresh(db_fish)
    return db_fish

@router.delete("/fishes/{fish_id}")
def delete_fish(
    fish_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    fish = session.get(Fish, fish_id)
    if not fish or fish.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Fish not found")
    
    session.delete(fish)
    session.commit()
    return {"ok": True}

@router.get("/fishes/{fish_id}/stats")
def get_fish_stats(
    fish_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from app.models.fish_farming import FishSaleItem, FishSale
    from sqlmodel import func
    from datetime import datetime
    
    # Verify fish ownership
    fish = session.get(Fish, fish_id)
    if not fish or fish.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Fish not found")
    
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
    
    # Get all sale items for this fish
    sale_items_query = select(FishSaleItem).where(FishSaleItem.fish_id == fish_id)
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
    
    # Get sales by date (for trend analysis)
    sales_by_date = {}
    for item, sale in filtered_items:
        date_key = sale.date.strftime("%Y-%m-%d")
        if date_key not in sales_by_date:
            sales_by_date[date_key] = {"amount": 0, "quantity": 0}
        sales_by_date[date_key]["amount"] += item.amount
        sales_by_date[date_key]["quantity"] += item.quantity
    
    return {
        "fish": {
            "id": fish.id,
            "name": fish.name,
            "category_id": fish.category_id
        },
        "total_sales": total_sales,
        "total_quantity_sold": total_quantity_sold,
        "sales_count": sales_count,
        "sales_by_date": sales_by_date,
        "start_date": start_date,
        "end_date": end_date
    }
