from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import FishFeed

router = APIRouter(tags=["fish_feeds"], prefix="/fish-feeds")

@router.post("", response_model=FishFeed)
def create_fish_feed(
    feed: FishFeed,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    feed.user_id = current_user.id
    session.add(feed)
    session.commit()
    session.refresh(feed)
    return feed

@router.get("", response_model=List[FishFeed])
def read_fish_feeds(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    feeds = session.exec(select(FishFeed).where(FishFeed.user_id == current_user.id)).all()
    return feeds

@router.put("/{feed_id}", response_model=FishFeed)
def update_fish_feed(
    feed_id: int,
    feed_update: FishFeed,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_feed = session.get(FishFeed, feed_id)
    if not db_feed or db_feed.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feed type not found")
    
    feed_data = feed_update.model_dump(exclude_unset=True)
    for key, value in feed_data.items():
        setattr(db_feed, key, value)
        
    session.add(db_feed)
    session.commit()
    session.refresh(db_feed)
    return db_feed

@router.delete("/{feed_id}")
def delete_fish_feed(
    feed_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    feed = session.get(FishFeed, feed_id)
    if not feed or feed.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feed type not found")
        
    session.delete(feed)
    session.commit()
    return {"ok": True}
