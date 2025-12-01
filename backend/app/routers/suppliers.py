from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.fish_farming import Supplier, SupplierTransaction

router = APIRouter(tags=["suppliers"])

# Supplier CRUD
@router.post("/suppliers", response_model=Supplier)
def create_supplier(
    supplier: Supplier,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    supplier.user_id = current_user.id
    session.add(supplier)
    session.commit()
    session.refresh(supplier)
    return supplier

@router.get("/suppliers", response_model=List[Supplier])
def read_suppliers(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(Supplier).where(Supplier.user_id == current_user.id)
    return session.exec(query).all()

@router.get("/suppliers/{supplier_id}", response_model=Supplier)
def read_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    supplier = session.get(Supplier, supplier_id)
    if not supplier or supplier.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/suppliers/{supplier_id}", response_model=Supplier)
def update_supplier(
    supplier_id: int,
    supplier_update: Supplier,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_supplier = session.get(Supplier, supplier_id)
    if not db_supplier or db_supplier.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    supplier_data = supplier_update.dict(exclude_unset=True)
    for key, value in supplier_data.items():
        setattr(db_supplier, key, value)
        
    session.add(db_supplier)
    session.commit()
    session.refresh(db_supplier)
    return db_supplier

@router.delete("/suppliers/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    supplier = session.get(Supplier, supplier_id)
    if not supplier or supplier.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    session.delete(supplier)
    session.commit()
    return {"ok": True}

# Supplier Transaction CRUD
@router.post("/supplier-transactions", response_model=SupplierTransaction)
def create_supplier_transaction(
    transaction: SupplierTransaction,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    from datetime import datetime
    
    # Verify supplier belongs to user
    supplier = session.get(Supplier, transaction.supplier_id)
    if not supplier or supplier.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Parse date if it's a string
    if isinstance(transaction.date, str):
        try:
            transaction.date = datetime.fromisoformat(transaction.date.replace('Z', '+00:00'))
        except ValueError:
            transaction.date = datetime.utcnow()
    
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

@router.get("/supplier-transactions/{supplier_id}", response_model=List[SupplierTransaction])
def read_supplier_transactions(
    supplier_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Verify supplier belongs to user
    supplier = session.get(Supplier, supplier_id)
    if not supplier or supplier.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    query = select(SupplierTransaction).where(SupplierTransaction.supplier_id == supplier_id)
    return session.exec(query).all()

@router.delete("/supplier-transactions/{transaction_id}")
def delete_supplier_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    transaction = session.get(SupplierTransaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify supplier belongs to user
    supplier = session.get(Supplier, transaction.supplier_id)
    if not supplier or supplier.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Unauthorized")
    
    session.delete(transaction)
    session.commit()
    return {"ok": True}
