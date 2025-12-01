from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import FishSale, FishSaleItem

router = APIRouter(tags=["fish_sales"])

class FishSaleItemCreate(BaseModel):
    pond_id: int
    quantity: float
    unit_id: int
    rate_per_unit: float
    amount: float

class FishSaleCreate(BaseModel):
    date: str
    buyer_name: str = None
    total_amount: float
    total_weight: float = None
    items: List[FishSaleItemCreate] = []  # Make items optional

@router.post("/fish-sales", response_model=FishSale)
def create_fish_sale(
    sale_data: FishSaleCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    # Parse date
    sale_date = datetime.fromisoformat(sale_data.date.replace('Z', '+00:00'))
    
    # Create sale
    sale = FishSale(
        date=sale_date,
        buyer_name=sale_data.buyer_name,
        total_amount=sale_data.total_amount,
        total_weight=sale_data.total_weight,
        user_id=current_user.id
    )
    session.add(sale)
    session.commit()
    session.refresh(sale)
    
    # Create sale items
    for item_data in sale_data.items:
        item = FishSaleItem(
            sale_id=sale.id,
            pond_id=item_data.pond_id,
            quantity=item_data.quantity,
            unit_id=item_data.unit_id,
            rate_per_unit=item_data.rate_per_unit,
            amount=item_data.amount
        )
        session.add(item)
    
    session.commit()
    session.refresh(sale)
    return sale

@router.get("/fish-sales", response_model=List[FishSale])
def read_fish_sales(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(FishSale).where(FishSale.user_id == current_user.id).order_by(FishSale.date.desc())
    return session.exec(query).all()

@router.get("/fish-sales/{sale_id}", response_model=FishSale)
def read_fish_sale(
    sale_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    sale = session.get(FishSale, sale_id)
    if not sale or sale.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.delete("/fish-sales/{sale_id}")
def delete_fish_sale(
    sale_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    sale = session.get(FishSale, sale_id)
    if not sale or sale.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Delete associated items
    items_query = select(FishSaleItem).where(FishSaleItem.sale_id == sale_id)
    items = session.exec(items_query).all()
    for item in items:
        session.delete(item)
    
    session.delete(sale)
    session.commit()
    return {"ok": True}
