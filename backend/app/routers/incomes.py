from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.income import Income

router = APIRouter(prefix="/incomes", tags=["incomes"])

@router.post("", response_model=Income)
def create_income(
    income: Income,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    income.user_id = current_user.id
    
    # Ensure date is a datetime object
    if isinstance(income.date, str):
        try:
            income.date = datetime.fromisoformat(income.date.replace('Z', '+00:00'))
        except ValueError:
            pass
            
    session.add(income)
    session.commit()
    session.refresh(income)
    return income

@router.get("", response_model=List[Income])
def get_incomes(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    person_id: Optional[int] = Query(None),
    organization_id: Optional[int] = Query(None),
    income_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(Income).where(Income.user_id == current_user.id)
    
    # Apply date filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(Income.date >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(Income.date <= end_dt)
        except ValueError:
            pass
    
    # Apply other filters
    if person_id:
        query = query.where(Income.person_id == person_id)
    
    if organization_id:
        query = query.where(Income.organization_id == organization_id)
    
    if income_type:
        query = query.where(Income.income_type == income_type)
    
    query = query.order_by(Income.date.desc())
    incomes = session.exec(query).all()
    return incomes

@router.get("/{income_id}", response_model=Income)
def get_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    income = session.get(Income, income_id)
    if not income or income.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Income not found")
    return income

@router.put("/{income_id}", response_model=Income)
def update_income(
    income_id: int,
    income_update: Income,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    income = session.get(Income, income_id)
    if not income or income.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Income not found")
    
    income.person_id = income_update.person_id
    income.organization_id = income_update.organization_id
    income.amount = income_update.amount
    
    # Ensure date is a datetime object
    if isinstance(income_update.date, str):
        try:
            income.date = datetime.fromisoformat(income_update.date.replace('Z', '+00:00'))
        except ValueError:
            income.date = income_update.date
    else:
        income.date = income_update.date
        
    income.income_type = income_update.income_type
    income.note = income_update.note
    
    session.add(income)
    session.commit()
    session.refresh(income)
    return income

@router.delete("/{income_id}")
def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    income = session.get(Income, income_id)
    if not income or income.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Income not found")
    
    session.delete(income)
    session.commit()
    return {"message": "Income deleted successfully"}
