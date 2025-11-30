from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import Debtor, User
from app.auth import get_current_user

router = APIRouter(tags=["debtors"])

@router.post("/debtors", response_model=Debtor)
def create_debtor(
    debtor: Debtor, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    debtor.user_id = current_user.id
    session.add(debtor)
    session.commit()
    session.refresh(debtor)
    return debtor

@router.get("/debtors", response_model=List[Debtor])
def read_debtors(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Debtor).where(Debtor.user_id == current_user.id)
    debtors = session.exec(statement).all()
    return debtors

@router.get("/debtors/{debtor_id}", response_model=Debtor)
def read_debtor(
    debtor_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Debtor).where(Debtor.id == debtor_id, Debtor.user_id == current_user.id)
    debtor = session.exec(statement).first()
    if not debtor:
        raise HTTPException(status_code=404, detail="Debtor not found")
    return debtor

@router.put("/debtors/{debtor_id}", response_model=Debtor)
def update_debtor(
    debtor_id: int,
    debtor_data: Debtor,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Debtor).where(Debtor.id == debtor_id, Debtor.user_id == current_user.id)
    debtor = session.exec(statement).first()
    if not debtor:
        raise HTTPException(status_code=404, detail="Debtor not found")
    
    debtor.name = debtor_data.name
    debtor.phone = debtor_data.phone
    debtor.debtor_type = debtor_data.debtor_type
    debtor.is_active = debtor_data.is_active
    session.add(debtor)
    session.commit()
    session.refresh(debtor)
    return debtor

@router.delete("/debtors/{debtor_id}")
def delete_debtor(
    debtor_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Debtor).where(Debtor.id == debtor_id, Debtor.user_id == current_user.id)
    debtor = session.exec(statement).first()
    if not debtor:
        raise HTTPException(status_code=404, detail="Debtor not found")
    
    session.delete(debtor)
    session.commit()
    return {"ok": True}
