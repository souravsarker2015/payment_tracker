from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import Creditor, User
from app.auth import get_current_user

router = APIRouter(tags=["creditors"])

@router.post("/creditors", response_model=Creditor)
def create_creditor(
    creditor: Creditor, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    creditor.user_id = current_user.id
    session.add(creditor)
    session.commit()
    session.refresh(creditor)
    return creditor

@router.get("/creditors", response_model=List[Creditor])
def read_creditors(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Creditor).where(Creditor.user_id == current_user.id)
    creditors = session.exec(statement).all()
    return creditors

@router.get("/creditors/{creditor_id}", response_model=Creditor)
def read_creditor(
    creditor_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Creditor).where(Creditor.id == creditor_id, Creditor.user_id == current_user.id)
    creditor = session.exec(statement).first()
    if not creditor:
        raise HTTPException(status_code=404, detail="Creditor not found")
    return creditor

@router.put("/creditors/{creditor_id}", response_model=Creditor)
def update_creditor(
    creditor_id: int,
    creditor_data: Creditor,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Creditor).where(Creditor.id == creditor_id, Creditor.user_id == current_user.id)
    creditor = session.exec(statement).first()
    if not creditor:
        raise HTTPException(status_code=404, detail="Creditor not found")
    
    creditor.name = creditor_data.name
    creditor.phone = creditor_data.phone
    creditor.creditor_type = creditor_data.creditor_type
    creditor.is_active = creditor_data.is_active
    session.add(creditor)
    session.commit()
    session.refresh(creditor)
    return creditor

@router.delete("/creditors/{creditor_id}")
def delete_creditor(
    creditor_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Creditor).where(Creditor.id == creditor_id, Creditor.user_id == current_user.id)
    creditor = session.exec(statement).first()
    if not creditor:
        raise HTTPException(status_code=404, detail="Creditor not found")
    
    session.delete(creditor)
    session.commit()
    return {"ok": True}
