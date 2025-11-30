from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import DebtorTransaction, Debtor, User
from app.auth import get_current_user
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(tags=["debtor_transactions"])

class DebtorTransactionCreate(BaseModel):
    debtor_id: int
    amount: float
    type: str  # "LEND" or "RECEIVE"
    note: Optional[str] = None
    date: Optional[str] = None  # ISO string from frontend

class DebtorTransactionUpdate(BaseModel):
    debtor_id: int
    amount: float
    type: str
    note: Optional[str] = None
    date: Optional[str] = None

@router.post("/debtor-transactions", response_model=DebtorTransaction)
def create_debtor_transaction(
    transaction_data: DebtorTransactionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify debtor belongs to user
    statement = select(Debtor).where(Debtor.id == transaction_data.debtor_id, Debtor.user_id == current_user.id)
    debtor = session.exec(statement).first()
    if not debtor:
        raise HTTPException(status_code=404, detail="Debtor not found")
    
    # Parse date if provided, otherwise use current time
    transaction_date = datetime.fromisoformat(transaction_data.date.replace('Z', '+00:00')) if transaction_data.date else datetime.utcnow()
    
    transaction = DebtorTransaction(
        debtor_id=transaction_data.debtor_id,
        amount=transaction_data.amount,
        type=transaction_data.type,
        note=transaction_data.note,
        date=transaction_date
    )
    
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

@router.put("/debtor-transactions/{transaction_id}", response_model=DebtorTransaction)
def update_debtor_transaction(
    transaction_id: int,
    transaction_data: DebtorTransactionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Ensure transaction belongs to a debtor owned by the current user
    statement = select(DebtorTransaction).join(Debtor).where(
        DebtorTransaction.id == transaction_id,
        Debtor.user_id == current_user.id
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

@router.delete("/debtor-transactions/{transaction_id}")
def delete_debtor_transaction(
    transaction_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(DebtorTransaction).join(Debtor).where(
        DebtorTransaction.id == transaction_id,
        Debtor.user_id == current_user.id
    )
    transaction = session.exec(statement).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    session.delete(transaction)
    session.commit()
    return {"ok": True}

@router.get("/debtor-transactions", response_model=List[DebtorTransaction])
def read_debtor_transactions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Join with Debtor to ensure we only get transactions for the current user's debtors
    statement = select(DebtorTransaction).join(Debtor).where(Debtor.user_id == current_user.id)
    transactions = session.exec(statement).all()
    return transactions
