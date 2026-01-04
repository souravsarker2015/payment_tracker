from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import PondFeedUsage, Pond, FishFeed, Unit

router = APIRouter(tags=["feed_usage"], prefix="/feed-usage")

@router.post("", response_model=PondFeedUsage)
def create_feed_usage(
    usage: PondFeedUsage,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    # Verify pond belongs to user
    pond = session.get(Pond, usage.pond_id)
    if not pond or pond.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Pond not found")
            
    # Verify feed belongs to user
    feed = session.get(FishFeed, usage.feed_id)
    if not feed or feed.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feed type not found")
            
    # Parse date if it's a string
    if isinstance(usage.date, str):
        try:
            usage.date = datetime.fromisoformat(usage.date.replace('Z', '+00:00'))
        except ValueError:
            usage.date = datetime.now()
            
    # Calculate total cost
    usage.total_cost = usage.quantity * usage.price_per_unit
    
    usage.user_id = current_user.id
    session.add(usage)
    session.commit()
    session.refresh(usage)
    return usage

@router.get("", response_model=List[Any])
def read_feed_usages(
    pond_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    query = select(PondFeedUsage).where(PondFeedUsage.user_id == current_user.id)
    
    if pond_id:
        query = query.where(PondFeedUsage.pond_id == pond_id)
        
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(PondFeedUsage.date >= start_dt)
        except ValueError:
            pass
            
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(PondFeedUsage.date <= end_dt)
        except ValueError:
            pass
    
    # Sort by date descending
    query = query.order_by(PondFeedUsage.date.desc())
    
    usages = session.exec(query).all()
    
    # Return enriched data
    result = []
    for u in usages:
        u_dict = u.model_dump()
        if u.feed:
             u_dict['feed_name'] = u.feed.name
             u_dict['feed_brand'] = u.feed.brand
        if u.pond:
             u_dict['pond_name'] = u.pond.name
        if u.unit:
             u_dict['unit_name'] = u.unit.name
        result.append(u_dict)
        
    return result

@router.put("/{usage_id}", response_model=PondFeedUsage)
def update_feed_usage(
    usage_id: int,
    usage_update: PondFeedUsage,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    db_usage = session.get(PondFeedUsage, usage_id)
    if not db_usage or db_usage.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Usage record not found")
    
    if usage_update.pond_id:
        pond = session.get(Pond, usage_update.pond_id)
        if not pond or pond.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Pond not found")
            
    if usage_update.feed_id:
        feed = session.get(FishFeed, usage_update.feed_id)
        if not feed or feed.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Feed type not found")
    
    # Parse date if it's a string
    if isinstance(usage_update.date, str):
        try:
            usage_update.date = datetime.fromisoformat(usage_update.date.replace('Z', '+00:00'))
        except ValueError:
            pass
            
    # Update fields
    usage_data = usage_update.model_dump(exclude_unset=True, exclude={'id', 'user_id'})
    for key, value in usage_data.items():
        setattr(db_usage, key, value)
        
    # Recalculate total cost if quantity or price changed
    if 'quantity' in usage_data or 'price_per_unit' in usage_data:
        db_usage.total_cost = db_usage.quantity * db_usage.price_per_unit
    
    session.add(db_usage)
    session.commit()
    session.refresh(db_usage)
    return db_usage

@router.delete("/{usage_id}")
def delete_feed_usage(
    usage_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    usage = session.get(PondFeedUsage, usage_id)
    if not usage or usage.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Usage record not found")
    
    session.delete(usage)
    session.commit()
    return {"ok": True}
