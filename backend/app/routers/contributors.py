from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import Contributor, User
from app.auth import get_current_user

router = APIRouter(tags=["contributors"])

@router.post("/contributors", response_model=Contributor)
def create_contributor(
    contributor: Contributor, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    contributor.user_id = current_user.id
    session.add(contributor)
    session.commit()
    session.refresh(contributor)
    return contributor

@router.get("/contributors", response_model=List[Contributor])
def read_contributors(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Contributor).where(Contributor.user_id == current_user.id)
    contributors = session.exec(statement).all()
    return contributors

@router.get("/contributors/{contributor_id}", response_model=Contributor)
def read_contributor(
    contributor_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Contributor).where(Contributor.id == contributor_id, Contributor.user_id == current_user.id)
    contributor = session.exec(statement).first()
    if not contributor:
        raise HTTPException(status_code=404, detail="Contributor not found")
    return contributor

@router.put("/contributors/{contributor_id}", response_model=Contributor)
def update_contributor(
    contributor_id: int,
    contributor_data: Contributor,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Contributor).where(Contributor.id == contributor_id, Contributor.user_id == current_user.id)
    contributor = session.exec(statement).first()
    if not contributor:
        raise HTTPException(status_code=404, detail="Contributor not found")
    
    contributor.name = contributor_data.name
    contributor.phone = contributor_data.phone
    contributor.contributor_type = contributor_data.contributor_type
    contributor.is_active = contributor_data.is_active
    session.add(contributor)
    session.commit()
    session.refresh(contributor)
    return contributor

@router.delete("/contributors/{contributor_id}")
def delete_contributor(
    contributor_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Contributor).where(Contributor.id == contributor_id, Contributor.user_id == current_user.id)
    contributor = session.exec(statement).first()
    if not contributor:
        raise HTTPException(status_code=404, detail="Contributor not found")
    
    session.delete(contributor)
    session.commit()
    return {"ok": True}
