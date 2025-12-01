from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import LaborCost

router = APIRouter(tags=["labor"])

@router.post("/labor-costs", response_model=LaborCost)
def create_labor_cost(
    labor: LaborCost,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    # Parse date if it's a string
    if isinstance(labor.date, str):
        try:
            labor.date = datetime.fromisoformat(labor.date.replace('Z', '+00:00'))
        except ValueError:
            labor.date = datetime.utcnow()
    
    labor.user_id = current_user.id
    session.add(labor)
    session.commit()
    session.refresh(labor)
    return labor

@router.get("/labor-costs", response_model=List[LaborCost])
def read_labor_costs(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(LaborCost).where(LaborCost.user_id == current_user.id).order_by(LaborCost.date.desc())
    return session.exec(query).all()

@router.put("/labor-costs/{labor_id}", response_model=LaborCost)
def update_labor_cost(
    labor_id: int,
    labor_update: LaborCost,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_labor = session.get(LaborCost, labor_id)
    if not db_labor or db_labor.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Labor cost not found")
    
    labor_data = labor_update.dict(exclude_unset=True)
    for key, value in labor_data.items():
        setattr(db_labor, key, value)
        
    session.add(db_labor)
    session.commit()
    session.refresh(db_labor)
    return db_labor

@router.delete("/labor-costs/{labor_id}")
def delete_labor_cost(
    labor_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    labor = session.get(LaborCost, labor_id)
    if not labor or labor.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Labor cost not found")
    
    session.delete(labor)
    session.commit()
    return {"ok": True}
