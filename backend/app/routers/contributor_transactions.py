from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import ContributorTransaction, Contributor, User
from app.auth import get_current_user
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(tags=["contributor_transactions"])

class ContributorTransactionCreate(BaseModel):
    contributor_id: int
    amount: float
    type: str  # "CONTRIBUTE" or "RETURN"
    note: Optional[str] = None
    date: Optional[str] = None  # ISO string from frontend

class ContributorTransactionUpdate(BaseModel):
    contributor_id: int
    amount: float
    type: str
    note: Optional[str] = None
    date: Optional[str] = None

@router.post("/contributor-transactions", response_model=ContributorTransaction)
def create_contributor_transaction(
    transaction_data: ContributorTransactionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify contributor belongs to user
    statement = select(Contributor).where(Contributor.id == transaction_data.contributor_id, Contributor.user_id == current_user.id)
    contributor = session.exec(statement).first()
    if not contributor:
        raise HTTPException(status_code=404, detail="Contributor not found")
    
    # Parse date if provided, otherwise use current time
    transaction_date = datetime.fromisoformat(transaction_data.date.replace('Z', '+00:00')) if transaction_data.date else datetime.utcnow()
    
    transaction = ContributorTransaction(
        contributor_id=transaction_data.contributor_id,
        amount=transaction_data.amount,
        type=transaction_data.type,
        note=transaction_data.note,
        date=transaction_date
    )
    
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

@router.put("/contributor-transactions/{transaction_id}", response_model=ContributorTransaction)
def update_contributor_transaction(
    transaction_id: int,
    transaction_data: ContributorTransactionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Ensure transaction belongs to a contributor owned by the current user
    statement = select(ContributorTransaction).join(Contributor).where(
        ContributorTransaction.id == transaction_id,
        Contributor.user_id == current_user.id
    )
    transaction = session.exec(statement).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction.amount = transaction_data.amount
    transaction.type = transaction_data.type
    transaction.note = transaction_data.note
    
    # Parse date if provided
    if transaction_data.date:
        transaction.date = datetime.fromisoformat(transaction_data.date.replace('Z', '+00:00'))
    
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

@router.delete("/contributor-transactions/{transaction_id}")
def delete_contributor_transaction(
    transaction_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(ContributorTransaction).join(Contributor).where(
        ContributorTransaction.id == transaction_id,
        Contributor.user_id == current_user.id
    )
    transaction = session.exec(statement).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    session.delete(transaction)
    session.commit()
    return {"ok": True}

@router.get("/contributor-transactions", response_model=List[ContributorTransaction])
def read_contributor_transactions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Join with Contributor to ensure we only get transactions for the current user's contributors
    statement = select(ContributorTransaction).join(Contributor).where(Contributor.user_id == current_user.id)
    transactions = session.exec(statement).all()
    return transactions
