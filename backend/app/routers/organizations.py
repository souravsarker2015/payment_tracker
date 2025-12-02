from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.income import Organization

router = APIRouter(prefix="/organizations", tags=["organizations"])

@router.post("", response_model=Organization)
def create_organization(
    organization: Organization,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    organization.user_id = current_user.id
    session.add(organization)
    session.commit()
    session.refresh(organization)
    return organization

@router.get("", response_model=List[Organization])
def get_organizations(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(Organization).where(Organization.user_id == current_user.id)
    organizations = session.exec(statement).all()
    return organizations

@router.get("/{organization_id}", response_model=Organization)
def get_organization(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    organization = session.get(Organization, organization_id)
    if not organization or organization.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization

@router.put("/{organization_id}", response_model=Organization)
def update_organization(
    organization_id: int,
    organization_update: Organization,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    organization = session.get(Organization, organization_id)
    if not organization or organization.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    organization.name = organization_update.name
    organization.address = organization_update.address
    organization.contact_person = organization_update.contact_person
    organization.phone = organization_update.phone
    organization.is_active = organization_update.is_active
    
    session.add(organization)
    session.commit()
    session.refresh(organization)
    return organization

@router.delete("/{organization_id}")
def delete_organization(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    organization = session.get(Organization, organization_id)
    if not organization or organization.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    session.delete(organization)
    session.commit()
    return {"message": "Organization deleted successfully"}
