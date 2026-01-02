from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import PondFeed, Pond, Supplier

router = APIRouter(tags=["pond_feeds"])

@router.post("/pond-feeds", response_model=PondFeed)
def create_pond_feed(
    feed: PondFeed,
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

@router.get("/pond-feeds", response_model=List[PondFeed])
def read_pond_feeds(
    pond_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    query = select(PondFeed).where(PondFeed.user_id == current_user.id)
    
    if pond_id:
        query = query.where(PondFeed.pond_id == pond_id)
        
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(PondFeed.date >= start_dt)
        except ValueError:
            pass
            
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(PondFeed.date <= end_dt)
        except ValueError:
            pass
    
    # Sort by date descending
    query = query.order_by(PondFeed.date.desc())
    
    return session.exec(query).all()

@router.put("/pond-feeds/{feed_id}", response_model=PondFeed)
def update_pond_feed(
    feed_id: int,
    feed_update: PondFeed,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    # Get existing feed
    db_feed = session.get(PondFeed, feed_id)
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
    
    # Parse date if it's a string
    if isinstance(feed_update.date, str):
        try:
            feed_update.date = datetime.fromisoformat(feed_update.date.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    # Update fields
    feed_data = feed_update.dict(exclude_unset=True, exclude={'id', 'user_id'})
    for key, value in feed_data.items():
        setattr(db_feed, key, value)
    
    session.add(db_feed)
    session.commit()
    session.refresh(db_feed)
    return db_feed

@router.delete("/pond-feeds/{feed_id}")
def delete_pond_feed(
    feed_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    feed = session.get(PondFeed, feed_id)
    if not feed or feed.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feed record not found")
    
    session.delete(feed)
    session.commit()
    return {"ok": True}
