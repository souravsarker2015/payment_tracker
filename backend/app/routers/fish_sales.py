from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select, func
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
    sale_type: str = "detailed"  # 'simple' or 'detailed'
    total_amount: float
    total_weight: float = None
    items: List[FishSaleItemCreate] = []  # Make items optional

class FishSaleItemResponse(BaseModel):
    id: int
    sale_id: int
    pond_id: int
    quantity: float
    unit_id: int
    rate_per_unit: float
    amount: float
    
    class Config:
        from_attributes = True

class FishSaleResponse(BaseModel):
    id: int
    date: str
    buyer_name: str | None
    sale_type: str
    total_amount: float
    total_weight: float | None
    items: List[FishSaleItemResponse] = []
    
    class Config:
        from_attributes = True

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
        sale_type=sale_data.sale_type,
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

@router.get("/fish-sales", response_model=List[FishSaleResponse])
def read_fish_sales(
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from sqlmodel import select
    from sqlalchemy.orm import selectinload
    from datetime import datetime
    
    query = (
        select(FishSale)
        .where(FishSale.user_id == current_user.id)
        .options(selectinload(FishSale.items))
    )
    
    # Apply date filters if provided
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(FishSale.date >= start_dt)
            print(f"Filtering sales from: {start_dt}")
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(FishSale.date <= end_dt)
            print(f"Filtering sales until: {end_dt}")
        except ValueError:
            pass
    
    query = query.order_by(FishSale.date.desc())
    sales = session.exec(query).all()
    
    print(f"Found {len(sales)} sales")
    
    # Convert to response model with error handling
    result = []
    for sale in sales:
        try:
            # Ensure items is not None
            items_list = sale.items if sale.items is not None else []
            print(f"Sale {sale.id} has {len(items_list)} items")
            
            result.append(FishSaleResponse(
                id=sale.id,
                date=sale.date.isoformat(),
                buyer_name=sale.buyer_name,
                sale_type=sale.sale_type,
                total_amount=sale.total_amount,
                total_weight=sale.total_weight,
                items=[
                    FishSaleItemResponse(
                        id=item.id,
                        sale_id=item.sale_id,
                        pond_id=item.pond_id,
                        quantity=item.quantity,
                        unit_id=item.unit_id,
                        rate_per_unit=item.rate_per_unit,
                        amount=item.amount
                    ) for item in items_list
                ]
            ))
        except Exception as e:
            print(f"Error processing sale {sale.id}: {str(e)}")
            # Continue processing other sales
            continue
    
    return result

@router.put("/fish-sales/{sale_id}", response_model=FishSaleResponse)
async def update_fish_sale(
    sale_id: int,
    request: Request,
    sale_data: FishSaleCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    # Log raw body
    body = await request.body()
    print(f"RAW UPDATE BODY: {body.decode()}")
    
    print(f"Updating sale {sale_id} with data: {sale_data}")
    print(f"Items count: {len(sale_data.items)}")
    
    # Get existing sale
    db_sale = session.get(FishSale, sale_id)
    if not db_sale or db_sale.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Parse date
    sale_date = datetime.fromisoformat(sale_data.date.replace('Z', '+00:00'))
    
    # Use a single transaction for atomicity
    try:
        # 1. Update sale details
        db_sale.date = sale_date
        db_sale.buyer_name = sale_data.buyer_name
        db_sale.sale_type = sale_data.sale_type
        db_sale.total_amount = sale_data.total_amount
        db_sale.total_weight = sale_data.total_weight
        session.add(db_sale)

        # 2. Delete existing items
        # Safety check: If detailed sale but no items provided, ABORT to prevent data loss
        if sale_data.sale_type == 'detailed' and not sale_data.items:
            raise ValueError("Detailed sale update must include items. Operation aborted to prevent data loss.")

        existing_items = session.exec(
            select(FishSaleItem).where(FishSaleItem.sale_id == sale_id)
        ).all()
        print(f"Deleting {len(existing_items)} existing items")
        for item in existing_items:
            session.delete(item)
        
        # 3. Create new items
        if not sale_data.items:
            print("WARNING: No items provided in update request! Detailed entry will be lost.")
        
        for item_data in sale_data.items:
            print(f"Adding item: {item_data}")
            item = FishSaleItem(
                sale_id=sale_id,
                pond_id=item_data.pond_id,
                quantity=item_data.quantity,
                unit_id=item_data.unit_id,
                rate_per_unit=item_data.rate_per_unit,
                amount=item_data.amount
            )
            session.add(item)
        
        session.commit()
        session.refresh(db_sale)
    except ValueError as e:
        session.rollback()
        print(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        session.rollback()
        print(f"Error updating sale: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    # Return response model
    return FishSaleResponse(
        id=db_sale.id,
        date=db_sale.date.isoformat(),
        buyer_name=db_sale.buyer_name,
        sale_type=db_sale.sale_type,
        total_amount=db_sale.total_amount,
        total_weight=db_sale.total_weight,
        items=[
            FishSaleItemResponse(
                id=item.id,
                sale_id=item.sale_id,
                pond_id=item.pond_id,
                quantity=item.quantity,
                unit_id=item.unit_id,
                rate_per_unit=item.rate_per_unit,
                amount=item.amount
            ) for item in db_sale.items
        ]
    )

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
