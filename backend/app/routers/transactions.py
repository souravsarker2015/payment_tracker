from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import Transaction, Creditor, User
from app.routers.auth import get_current_user
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(tags=["transactions"])

class TransactionCreate(BaseModel):
    creditor_id: int
    amount: float
    type: str
    note: Optional[str] = None
    date: Optional[str] = None  # ISO string from frontend

class TransactionUpdate(BaseModel):
    creditor_id: int
    amount: float
    type: str
    note: Optional[str] = None
    date: Optional[str] = None  # ISO string from frontend

@router.post("/transactions", response_model=Transaction)
def create_transaction(
    transaction_data: TransactionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify creditor belongs to user
    statement = select(Creditor).where(Creditor.id == transaction_data.creditor_id, Creditor.user_id == current_user.id)
    creditor = session.exec(statement).first()
    if not creditor:
        raise HTTPException(status_code=404, detail="Creditor not found")
    
    # Parse date if provided, otherwise use current time
    transaction_date = datetime.fromisoformat(transaction_data.date.replace('Z', '+00:00')) if transaction_data.date else datetime.utcnow()
    
    transaction = Transaction(
        creditor_id=transaction_data.creditor_id,
        amount=transaction_data.amount,
        type=transaction_data.type,
        note=transaction_data.note,
        date=transaction_date
    )
    
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

@router.put("/transactions/{transaction_id}", response_model=Transaction)
def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Ensure transaction belongs to a creditor owned by the current user
    statement = select(Transaction).join(Creditor).where(
        Transaction.id == transaction_id,
        Creditor.user_id == current_user.id
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

@router.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Transaction).join(Creditor).where(
        Transaction.id == transaction_id,
        Creditor.user_id == current_user.id
    )
    transaction = session.exec(statement).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    session.delete(transaction)
    session.commit()
    return {"ok": True}

@router.get("/transactions", response_model=List[Transaction])
def read_transactions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Join with Creditor to ensure we only get transactions for the current user's creditors
    statement = select(Transaction).join(Creditor).where(Creditor.user_id == current_user.id)
    transactions = session.exec(statement).all()
    return transactions
