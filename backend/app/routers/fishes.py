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
