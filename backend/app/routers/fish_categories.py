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
