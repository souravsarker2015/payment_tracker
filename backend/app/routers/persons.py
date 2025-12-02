from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.income import Person

router = APIRouter(prefix="/persons", tags=["persons"])

@router.post("", response_model=Person)
def create_person(
    person: Person,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    person.user_id = current_user.id
    session.add(person)
    session.commit()
    session.refresh(person)
    return person

@router.get("", response_model=List[Person])
def get_persons(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(Person).where(Person.user_id == current_user.id)
    persons = session.exec(statement).all()
    return persons

@router.get("/{person_id}", response_model=Person)
def get_person(
    person_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    person = session.get(Person, person_id)
    if not person or person.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Person not found")
    return person

@router.put("/{person_id}", response_model=Person)
def update_person(
    person_id: int,
    person_update: Person,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    person = session.get(Person, person_id)
    if not person or person.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    person.name = person_update.name
    person.phone = person_update.phone
    person.designation = person_update.designation
    person.is_active = person_update.is_active
    
    session.add(person)
    session.commit()
    session.refresh(person)
    return person

@router.delete("/{person_id}")
def delete_person(
    person_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    person = session.get(Person, person_id)
    if not person or person.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Person not found")
    
    session.delete(person)
    session.commit()
    return {"message": "Person deleted successfully"}
