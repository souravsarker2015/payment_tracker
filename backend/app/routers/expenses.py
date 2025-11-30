from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime
from pydantic import BaseModel

from app.database import get_session
from app.auth import get_current_user
from app.models.user import User
from app.models.expense import Expense, ExpenseType

router = APIRouter(tags=["expenses"])

# --- Pydantic Models ---

class ExpenseCreate(BaseModel):
    amount: float
    description: Optional[str] = None
    date: Optional[str] = None
    expense_type_id: Optional[int] = None

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = None
    expense_type_id: Optional[int] = None

# --- Expense Types ---

@router.post("/expense-types", response_model=ExpenseType)
def create_expense_type(
    expense_type: ExpenseType,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    expense_type.user_id = current_user.id
    session.add(expense_type)
    session.commit()
    session.refresh(expense_type)
    return expense_type

@router.get("/expense-types", response_model=List[ExpenseType])
def read_expense_types(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(ExpenseType).where(ExpenseType.user_id == current_user.id)
    return session.exec(query).all()

@router.delete("/expense-types/{type_id}")
def delete_expense_type(
    type_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    expense_type = session.get(ExpenseType, type_id)
    if not expense_type or expense_type.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Expense type not found")
    
    session.delete(expense_type)
    session.commit()
    return {"ok": True}

# --- Expenses ---

@router.post("/expenses", response_model=Expense)
def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Parse date if provided, otherwise use current time
    expense_date = datetime.utcnow()
    if expense_data.date:
        try:
            expense_date = datetime.fromisoformat(expense_data.date.replace('Z', '+00:00'))
        except ValueError:
            pass # Keep default if parsing fails

    expense = Expense(
        amount=expense_data.amount,
        description=expense_data.description,
        date=expense_date,
        expense_type_id=expense_data.expense_type_id,
        user_id=current_user.id
    )

    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense

@router.get("/expenses", response_model=List[Expense])
def read_expenses(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    query = select(Expense).where(Expense.user_id == current_user.id)
    
    if start_date:
        query = query.where(Expense.date >= start_date)
    if end_date:
        query = query.where(Expense.date <= end_date)
        
    query = query.offset(skip).limit(limit).order_by(Expense.date.desc())
    return session.exec(query).all()

@router.put("/expenses/{expense_id}", response_model=Expense)
def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_expense = session.get(Expense, expense_id)
    if not db_expense or db_expense.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    expense_data = expense_update.dict(exclude_unset=True)
    for key, value in expense_data.items():
        if key == 'date' and value:
            try:
                value = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                continue
        setattr(db_expense, key, value)
        
    session.add(db_expense)
    session.commit()
    session.refresh(db_expense)
    return db_expense

@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    expense = session.get(Expense, expense_id)
    if not expense or expense.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    session.delete(expense)
    session.commit()
    return {"ok": True}

@router.get("/expenses/stats/overview")
def get_expense_stats(
    year: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    now = datetime.utcnow()
    target_year = year if year else now.year
    
    # Fetch all user expenses for the target year
    # Note: In a real app, we should filter in the DB query for efficiency.
    # Here we filter in python for simplicity as we already have logic.
    # Better: Filter by date range in SQL.
    start_date = datetime(target_year, 1, 1)
    end_date = datetime(target_year, 12, 31, 23, 59, 59)
    
    query = select(Expense).where(
        Expense.user_id == current_user.id,
        Expense.date >= start_date,
        Expense.date <= end_date
    )
    expenses = session.exec(query).all()
    
    # Calculate Totals
    total_spent_year = sum(e.amount for e in expenses)
    
    # Avg Monthly Spend
    if target_year < now.year:
        months_count = 12
    elif target_year == now.year:
        months_count = now.month or 1 # Avoid 0
    else:
        months_count = 1 # Future year
        
    avg_monthly_spend = total_spent_year / months_count if months_count > 0 else 0
    
    # Category Breakdown (for Pie Chart)
    types_query = select(ExpenseType).where(ExpenseType.user_id == current_user.id)
    expense_types = {t.id: t.name for t in session.exec(types_query).all()}
    
    category_stats = {}
    for e in expenses:
        type_name = expense_types.get(e.expense_type_id, "Uncategorized")
        category_stats[type_name] = category_stats.get(type_name, 0) + e.amount
        
    pie_chart_data = [{"name": k, "value": v} for k, v in category_stats.items()]
    
    # Monthly Trend (for Bar Chart)
    monthly_trend = {i: 0 for i in range(1, 13)}
    for e in expenses:
        monthly_trend[e.date.month] += e.amount
            
    bar_chart_data = [
        {"name": datetime(2000, m, 1).strftime("%b"), "amount": amount} # Year 2000 is arbitrary for month name
        for m, amount in monthly_trend.items()
    ]
    
    # Max Monthly Spend
    max_monthly_spend = max(monthly_trend.values()) if monthly_trend else 0
    
    return {
        "total_spent_year": total_spent_year,
        "avg_monthly_spend": avg_monthly_spend,
        "max_monthly_spend": max_monthly_spend,
        "pie_chart_data": pie_chart_data,
        "bar_chart_data": bar_chart_data
    }
