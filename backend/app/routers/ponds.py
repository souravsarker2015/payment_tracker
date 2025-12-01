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
