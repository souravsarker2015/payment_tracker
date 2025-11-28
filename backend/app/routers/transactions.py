from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import Transaction, Creditor, User
from app.routers.auth import get_current_user

router = APIRouter(tags=["transactions"])

@router.post("/transactions", response_model=Transaction)
def create_transaction(
    transaction: Transaction,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify creditor belongs to user
    statement = select(Creditor).where(Creditor.id == transaction.creditor_id, Creditor.user_id == current_user.id)
    creditor = session.exec(statement).first()
    if not creditor:
        raise HTTPException(status_code=404, detail="Creditor not found")
    
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

@router.put("/transactions/{transaction_id}", response_model=Transaction)
def update_transaction(
    transaction_id: int,
    transaction_data: Transaction,
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
    # We generally don't allow changing creditor_id or date for simplicity, but could be added.
    
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
