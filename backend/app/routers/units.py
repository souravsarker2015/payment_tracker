from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import Unit

router = APIRouter(tags=["units"])

@router.post("/units", response_model=Unit)
def create_unit(
    unit: Unit,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    unit.user_id = current_user.id
    unit.is_default = False
    session.add(unit)
    session.commit()
    session.refresh(unit)
    return unit

@router.get("/units", response_model=List[Unit])
def read_units(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Get both default units and user's custom units
    query = select(Unit).where(
        (Unit.is_default == True) | (Unit.user_id == current_user.id)
    )
    return session.exec(query).all()

@router.delete("/units/{unit_id}")
def delete_unit(
    unit_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    unit = session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    # Can't delete default units
    if unit.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default units")
    
    # Can only delete own units
    if unit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    session.delete(unit)
    session.commit()
    return {"ok": True}
