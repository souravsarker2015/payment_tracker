from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..database import get_session
from ..auth import get_current_user
from ..models import FishBuyer, FishSale, FishBuyerTransaction, User

router = APIRouter(
    prefix="/fish-buyers",
    tags=["Fish Buyers"],
    responses={404: {"description": "Not found"}},
)

@router.post("", response_model=FishBuyer)
def create_fish_buyer(
    buyer: FishBuyer,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    buyer.user_id = current_user.id
    session.add(buyer)
    session.commit()
    session.refresh(buyer)
    return buyer

@router.get("", response_model=List[Dict[str, Any]])
def read_fish_buyers(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    buyers = session.exec(select(FishBuyer).where(FishBuyer.user_id == current_user.id)).all()
    
    result = []
    for buyer in buyers:
        # Calculate stats
        sales = session.exec(select(FishSale).where(FishSale.buyer_id == buyer.id)).all()
        transactions = session.exec(select(FishBuyerTransaction).where(FishBuyerTransaction.buyer_id == buyer.id)).all()
        
        # From Sales
        total_bought_amount = sum(s.total_amount for s in sales)
        initial_paid_on_sales = sum(s.paid_amount for s in sales)
        
        # From Transactions
        total_paid_via_transactions = sum(t.amount for t in transactions if t.transaction_type == 'payment')
        
        total_paid = initial_paid_on_sales + total_paid_via_transactions
        balance_due = total_bought_amount - total_paid
        
        buyer_dict = buyer.model_dump()
        buyer_dict.update({
            "total_bought": total_bought_amount,
            "total_paid": total_paid,
            "balance": balance_due
        })
        result.append(buyer_dict)
        
    return result

@router.get("/{buyer_id}", response_model=Dict[str, Any])
def read_fish_buyer_details(
    buyer_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    buyer = session.get(FishBuyer, buyer_id)
    if not buyer or buyer.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Buyer not found")
        
    # Get all sales
    sales_query = select(FishSale).where(FishSale.buyer_id == buyer_id).order_by(FishSale.date.desc())
    if start_date and end_date:
        s_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        e_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        sales_query = sales_query.where(FishSale.date >= s_date, FishSale.date <= e_date)
        
    sales = session.exec(sales_query).all()
    
    # Get all transactions
    trans_query = select(FishBuyerTransaction).where(FishBuyerTransaction.buyer_id == buyer_id).order_by(FishBuyerTransaction.date.desc())
    if start_date and end_date:
        s_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        e_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        trans_query = trans_query.where(FishBuyerTransaction.date >= s_date, FishBuyerTransaction.date <= e_date)
        
    transactions = session.exec(trans_query).all()
    
    # Calculate totals (Lifetime)
    all_sales = session.exec(select(FishSale).where(FishSale.buyer_id == buyer_id)).all()
    all_trans = session.exec(select(FishBuyerTransaction).where(FishBuyerTransaction.buyer_id == buyer_id)).all()
    
    total_bought = sum(s.total_amount for s in all_sales)
    sales_paid = sum(s.paid_amount for s in all_sales)
    trans_paid = sum(t.amount for t in all_trans if t.transaction_type == 'payment')
    
    total_paid = sales_paid + trans_paid
    balance = total_bought - total_paid
    
    return {
        "buyer": buyer,
        "stats": {
            "total_bought": total_bought,
            "total_paid": total_paid,
            "balance": balance
        },
        "sales": sales,
        "transactions": transactions
    }

@router.post("/{buyer_id}/transactions", response_model=FishBuyerTransaction)
def create_buyer_transaction(
    buyer_id: int,
    transaction: FishBuyerTransaction,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    buyer = session.get(FishBuyer, buyer_id)
    if not buyer or buyer.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Buyer not found")
        
    transaction.buyer_id = buyer_id
    transaction.user_id = current_user.id
    # Ensure date is tz-aware if not already
    try:
        if isinstance(transaction.date, str):
             transaction.date = datetime.fromisoformat(transaction.date.replace('Z', '+00:00'))
    except Exception:
        pass # Let validation handle it if it fails
    
    session.add(transaction)
    session.commit()
    session.refresh(transaction)

    # Auto-distribute payment to oldest unpaid sales (FIFO)
    if transaction.transaction_type == 'payment' and transaction.amount > 0:
        remaining_payment = transaction.amount
        
        # Get unpaid/partial sales for this buyer, ordered by date
        unpaid_sales = session.exec(
            select(FishSale)
            .where(FishSale.buyer_id == buyer_id)
            .where(FishSale.payment_status != "paid")
            .order_by(FishSale.date)
        ).all()
        
        for sale in unpaid_sales:
            if remaining_payment <= 0:
                break
                
            # Calculate how much this sale needs
            sale_due = sale.total_amount - sale.paid_amount
            
            if sale_due > 0:
                amount_to_pay = min(sale_due, remaining_payment)
                
                # Update sale
                sale.paid_amount += amount_to_pay
                sale.due_amount = sale.total_amount - sale.paid_amount
                remaining_payment -= amount_to_pay
                
                # Update status
                if sale.due_amount <= 0:
                    sale.payment_status = "paid"
                    sale.due_amount = 0 # Ensure no floating point weirdness
                else:
                    sale.payment_status = "partial"
                
                session.add(sale)
        
        session.commit()
    
    return transaction

@router.put("/{buyer_id}", response_model=FishBuyer)
def update_fish_buyer(
    buyer_id: int,
    buyer_update: FishBuyer,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_buyer = session.get(FishBuyer, buyer_id)
    if not db_buyer or db_buyer.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Buyer not found")
        
    buyer_data = buyer_update.model_dump(exclude_unset=True)
    for key, value in buyer_data.items():
        setattr(db_buyer, key, value)
        
    session.add(db_buyer)
    session.commit()
    session.refresh(db_buyer)
    return db_buyer

@router.delete("/{buyer_id}")
def delete_fish_buyer(
    buyer_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    buyer = session.get(FishBuyer, buyer_id)
    if not buyer or buyer.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Buyer not found")
        
    session.delete(buyer)
    session.commit()
    return {"ok": True}
