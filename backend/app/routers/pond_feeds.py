from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import PondFeedPurchase, Pond, Supplier, FishFeed, Unit

router = APIRouter(tags=["pond_feeds"])

@router.post("/pond-feeds", response_model=PondFeedPurchase)
def create_pond_feed_purchase(
    feed: PondFeedPurchase,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    # Verify pond belongs to user if pond_id is provided
    if feed.pond_id:
        pond = session.get(Pond, feed.pond_id)
        if not pond or pond.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Pond not found")
    
    # Verify supplier belongs to user
    supplier = session.get(Supplier, feed.supplier_id)
    if not supplier or supplier.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Verify FishFeed if provided
    if feed.feed_id:
        fish_feed = session.get(FishFeed, feed.feed_id)
        if not fish_feed or fish_feed.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Feed Type not found")
            
    # Parse date if it's a string
    if isinstance(feed.date, str):
        try:
            feed.date = datetime.fromisoformat(feed.date.replace('Z', '+00:00'))
        except ValueError:
            feed.date = datetime.utcnow()
    
    feed.user_id = current_user.id
    session.add(feed)
    session.commit()
    session.refresh(feed)
    return feed

@router.get("/pond-feeds", response_model=List[Any])
def read_pond_feed_purchases(
    pond_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    query = select(PondFeedPurchase).where(PondFeedPurchase.user_id == current_user.id)
    
    if pond_id:
        query = query.where(PondFeedPurchase.pond_id == pond_id)
        
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(PondFeedPurchase.date >= start_dt)
        except ValueError:
            pass
            
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(PondFeedPurchase.date <= end_dt)
        except ValueError:
            pass
    
    # Sort by date descending
    query = query.order_by(PondFeedPurchase.date.desc())
    
    purchases = session.exec(query).all()
    
    # Manually load relationships for response (since we have mixed objects potentially or want to be safe)
    # Ideally use response_model with relationship but for now list dicts
    result = []
    for p in purchases:
        p_dict = p.model_dump()
        if p.feed:
             p_dict['feed_name'] = p.feed.name
             p_dict['feed_brand'] = p.feed.brand
        if p.pond:
             p_dict['pond_name'] = p.pond.name
        if p.supplier:
             p_dict['supplier_name'] = p.supplier.name
        if p.unit:
             p_dict['unit_name'] = p.unit.name
        result.append(p_dict)
        
    return result

@router.put("/pond-feeds/{feed_id}", response_model=PondFeedPurchase)
def update_pond_feed_purchase(
    feed_id: int,
    feed_update: PondFeedPurchase,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    # Get existing feed
    db_feed = session.get(PondFeedPurchase, feed_id)
    if not db_feed or db_feed.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feed record not found")
    
    # Verify pond belongs to user if pond_id is provided
    if feed_update.pond_id:
        pond = session.get(Pond, feed_update.pond_id)
        if not pond or pond.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Pond not found")
    
    # Verify supplier belongs to user
    supplier = session.get(Supplier, feed_update.supplier_id)
    if not supplier or supplier.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    if feed_update.feed_id:
        fish_feed = session.get(FishFeed, feed_update.feed_id)
        if not fish_feed or fish_feed.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Feed Type not found")
    
    # Parse date if it's a string
    if isinstance(feed_update.date, str):
        try:
            feed_update.date = datetime.fromisoformat(feed_update.date.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    # Update fields
    feed_data = feed_update.model_dump(exclude_unset=True, exclude={'id', 'user_id'})
    for key, value in feed_data.items():
        setattr(db_feed, key, value)
    
    session.add(db_feed)
    session.commit()
    session.refresh(db_feed)
    return db_feed

@router.delete("/pond-feeds/{feed_id}")
def delete_pond_feed_purchase(
    feed_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    feed = session.get(PondFeedPurchase, feed_id)
    if not feed or feed.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feed record not found")
    
    session.delete(feed)
    session.commit()
    return {"ok": True}
