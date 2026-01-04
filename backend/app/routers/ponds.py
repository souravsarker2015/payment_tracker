from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import Pond

router = APIRouter(tags=["ponds"])

@router.post("/ponds", response_model=Pond)
def create_pond(
    pond: Pond,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    pond.user_id = current_user.id
    session.add(pond)
    session.commit()
    session.refresh(pond)
    return pond

@router.get("/ponds", response_model=List[Pond])
def read_ponds(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(Pond).where(Pond.user_id == current_user.id)
    return session.exec(query).all()

@router.put("/ponds/{pond_id}", response_model=Pond)
def update_pond(
    pond_id: int,
    pond_update: Pond,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_pond = session.get(Pond, pond_id)
    if not db_pond or db_pond.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Pond not found")
    
    pond_data = pond_update.dict(exclude_unset=True)
    for key, value in pond_data.items():
        setattr(db_pond, key, value)
        
    session.add(db_pond)
    session.commit()
    session.refresh(db_pond)
    return db_pond

@router.delete("/ponds/{pond_id}")
def delete_pond(
    pond_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    pond = session.get(Pond, pond_id)
    if not pond or pond.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Pond not found")
    
    session.delete(pond)
    session.commit()
    return {"ok": True}

@router.get("/ponds/{pond_id}/stats")
def get_pond_stats(
    pond_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from app.models.fish_farming import FishSaleItem, PondFeedPurchase, LaborCost
    
    # Verify pond belongs to user
    pond = session.get(Pond, pond_id)
    if not pond or pond.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Pond not found")
    
    # Calculate total sales from this pond
    sales_query = select(FishSaleItem).where(FishSaleItem.pond_id == pond_id)
    sale_items = session.exec(sales_query).all()
    total_sales = sum(item.amount for item in sale_items)
    total_quantity_sold = sum(item.quantity for item in sale_items)
    
    # Calculate total feed expenses for this pond
    feeds_query = select(PondFeedPurchase).where(PondFeedPurchase.pond_id == pond_id)
    feeds = session.exec(feeds_query).all()
    total_feed_expense = sum(feed.total_amount for feed in feeds)
    
    # Group feed by supplier
    feed_by_supplier = {}
    feed_quantity_by_unit = {}
    for feed in feeds:
        # By supplier
        if feed.supplier_id not in feed_by_supplier:
            supplier = session.get(Pond, feed.supplier_id)
            feed_by_supplier[feed.supplier_id] = {
                "supplier_id": feed.supplier_id,
                "supplier_name": feed.supplier.name if feed.supplier else "Unknown",
                "total_amount": 0,
                "total_quantity": 0
            }
        feed_by_supplier[feed.supplier_id]["total_amount"] += feed.total_amount
        feed_by_supplier[feed.supplier_id]["total_quantity"] += feed.quantity
        
        # By unit
        unit_name = feed.unit.name if feed.unit else "Unknown"
        if unit_name not in feed_quantity_by_unit:
            feed_quantity_by_unit[unit_name] = 0
        feed_quantity_by_unit[unit_name] += feed.quantity
    
    # Calculate labor costs for this pond
    labor_query = select(LaborCost).where(LaborCost.pond_id == pond_id)
    labor_costs = session.exec(labor_query).all()
    total_labor = sum(labor.amount for labor in labor_costs)
    
    # Calculate profit/loss
    total_expenses = total_feed_expense + total_labor
    profit_loss = total_sales - total_expenses
    
    return {
        "pond": {
            "id": pond.id,
            "name": pond.name,
            "location": pond.location,
            "size": pond.size
        },
        "total_sales": total_sales,
        "total_quantity_sold": total_quantity_sold,
        "total_feed_expense": total_feed_expense,
        "total_labor": total_labor,
        "total_expenses": total_expenses,
        "profit_loss": profit_loss,
        "feed_by_supplier": list(feed_by_supplier.values()),
        "feed_quantity_by_unit": feed_quantity_by_unit,
        "sales_count": len(sale_items),
        "feed_purchases_count": len(feeds),
        "labor_entries_count": len(labor_costs)
    }
