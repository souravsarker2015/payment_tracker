from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.database import get_session
from app.auth import get_current_user
from app.models import User
from app.models.fish_farming import Pond, FishSale, PondFeedPurchase
from datetime import datetime, timedelta
from typing import List, Dict

router = APIRouter(tags=["dashboard"])

@router.get("/gher/dashboard/stats")
def get_dashboard_stats(
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get comprehensive dashboard statistics for gher management"""
    
    # Parse date filters if provided
    filter_start = None
    filter_end = None
    
    if start_date:
        try:
            filter_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    if end_date:
        try:
            filter_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    # Get date range for trends (last 6 months or filtered range)
    end_date_calc = filter_end if filter_end else datetime.now()
    start_date_calc = filter_start if filter_start else end_date_calc - timedelta(days=180)
    
    # Total ponds
    total_ponds = session.exec(
        select(func.count(Pond.id)).where(Pond.user_id == current_user.id)
    ).one()
    
    # Total sales revenue (filtered or all time)
    revenue_query = select(func.sum(FishSale.total_amount)).where(FishSale.user_id == current_user.id)
    if filter_start:
        revenue_query = revenue_query.where(FishSale.date >= filter_start)
    if filter_end:
        revenue_query = revenue_query.where(FishSale.date <= filter_end)
    total_revenue = session.exec(revenue_query).one() or 0
    
    # Total feed expenses (filtered or all time)
    expenses_query = select(func.sum(PondFeedPurchase.total_amount)).where(PondFeedPurchase.user_id == current_user.id)
    if filter_start:
        expenses_query = expenses_query.where(PondFeedPurchase.date >= filter_start)
    if filter_end:
        expenses_query = expenses_query.where(PondFeedPurchase.date <= filter_end)
    total_expenses = session.exec(expenses_query).one() or 0
    
    # This month's sales
    month_start = datetime(end_date_calc.year, end_date_calc.month, 1)
    month_sales = session.exec(
        select(func.sum(FishSale.total_amount))
        .where(FishSale.user_id == current_user.id)
        .where(FishSale.date >= month_start)
    ).one() or 0
    
    # This month's expenses
    month_expenses = session.exec(
        select(func.sum(PondFeedPurchase.total_amount))
        .where(PondFeedPurchase.user_id == current_user.id)
        .where(PondFeedPurchase.date >= month_start)
    ).one() or 0
    
    # Monthly sales trend (last 6 months)
    monthly_sales = []
    for i in range(6):
        month_date = end_date_calc - timedelta(days=30 * i)
        month_start = datetime(month_date.year, month_date.month, 1)
        if month_date.month == 12:
            month_end = datetime(month_date.year + 1, 1, 1)
        else:
            month_end = datetime(month_date.year, month_date.month + 1, 1)
        
        sales = session.exec(
            select(func.sum(FishSale.total_amount))
            .where(FishSale.user_id == current_user.id)
            .where(FishSale.date >= month_start)
            .where(FishSale.date < month_end)
        ).one() or 0
        
        monthly_sales.insert(0, {
            "month": month_start.strftime("%b %Y"),
            "amount": float(sales)
        })
    
    # Monthly expenses trend (last 6 months)
    monthly_expenses = []
    for i in range(6):
        month_date = end_date_calc - timedelta(days=30 * i)
        month_start = datetime(month_date.year, month_date.month, 1)
        if month_date.month == 12:
            month_end = datetime(month_date.year + 1, 1, 1)
        else:
            month_end = datetime(month_date.year, month_date.month + 1, 1)
        
        expenses = session.exec(
            select(func.sum(PondFeedPurchase.total_amount))
            .where(PondFeedPurchase.user_id == current_user.id)
            .where(PondFeedPurchase.date >= month_start)
            .where(PondFeedPurchase.date < month_end)
        ).one() or 0
        
        monthly_expenses.insert(0, {
            "month": month_start.strftime("%b %Y"),
            "amount": float(expenses)
        })
    
    # Top performing ponds by sales
    from sqlalchemy.orm import selectinload
    from app.models.fish_farming import FishSaleItem
    
    pond_sales_query = (
        select(
            Pond.name,
            func.sum(FishSaleItem.amount).label('total_sales')
        )
        .join(FishSaleItem, FishSaleItem.pond_id == Pond.id)
        .join(FishSale, FishSale.id == FishSaleItem.sale_id)
        .where(Pond.user_id == current_user.id)
    )
    
    if filter_start:
        pond_sales_query = pond_sales_query.where(FishSale.date >= filter_start)
    if filter_end:
        pond_sales_query = pond_sales_query.where(FishSale.date <= filter_end)
    
    pond_sales_query = (
        pond_sales_query
        .group_by(Pond.id, Pond.name)
        .order_by(func.sum(FishSaleItem.amount).desc())
        .limit(5)
    )
    
    pond_sales = session.exec(pond_sales_query).all()
    
    top_ponds = [
        {"name": name, "sales": float(sales)}
        for name, sales in pond_sales
    ]
    
    # Pond-wise breakdown with unit details
    from app.models.fish_farming import Unit
    
    pond_unit_query = (
        select(
            Pond.name.label('pond_name'),
            Unit.name.label('unit_name'),
            func.sum(FishSaleItem.quantity).label('total_quantity'),
            func.sum(FishSaleItem.amount).label('total_amount')
        )
        .join(FishSaleItem, FishSaleItem.pond_id == Pond.id)
        .join(Unit, Unit.id == FishSaleItem.unit_id)
        .join(FishSale, FishSale.id == FishSaleItem.sale_id)
        .where(Pond.user_id == current_user.id)
    )
    
    if filter_start:
        pond_unit_query = pond_unit_query.where(FishSale.date >= filter_start)
    if filter_end:
        pond_unit_query = pond_unit_query.where(FishSale.date <= filter_end)
    
    pond_unit_query = pond_unit_query.group_by(Pond.id, Pond.name, Unit.id, Unit.name)
    
    pond_unit_data = session.exec(pond_unit_query).all()
    
    pond_unit_breakdown = [
        {
            "pond_name": pond_name,
            "unit_name": unit_name,
            "quantity": float(quantity),
            "amount": float(amount)
        }
        for pond_name, unit_name, quantity, amount in pond_unit_data
    ]
    
    # Recent sales (last 5)
    recent_sales = session.exec(
        select(FishSale)
        .where(FishSale.user_id == current_user.id)
        .order_by(FishSale.date.desc())
        .limit(5)
    ).all()
    
    recent_activities = [
        {
            "id": sale.id,
            "type": "sale",
            "description": f"Sale to {sale.buyer_name or 'Customer'}",
            "amount": float(sale.total_amount),
            "date": sale.date.isoformat()
        }
        for sale in recent_sales
    ]
    
    # Unit-wise sales breakdown
    from app.models.fish_farming import Unit
    
    unit_sales_query = (
        select(
            Unit.name,
            func.sum(FishSaleItem.quantity).label('total_quantity'),
            func.sum(FishSaleItem.amount).label('total_amount')
        )
        .join(FishSaleItem, FishSaleItem.unit_id == Unit.id)
        .join(FishSale, FishSale.id == FishSaleItem.sale_id)
        .where(FishSale.user_id == current_user.id)
    )
    
    if filter_start:
        unit_sales_query = unit_sales_query.where(FishSale.date >= filter_start)
    if filter_end:
        unit_sales_query = unit_sales_query.where(FishSale.date <= filter_end)
    
    unit_sales_query = unit_sales_query.group_by(Unit.id, Unit.name)
    
    unit_sales_data = session.exec(unit_sales_query).all()
    
    unit_wise_sales = [
        {
            "unit_name": name,
            "quantity": float(quantity),
            "amount": float(amount)
        }
        for name, quantity, amount in unit_sales_data
    ]
    
    return {
        "summary": {
            "total_ponds": total_ponds,
            "total_revenue": float(total_revenue),
            "total_expenses": float(total_expenses),
            "profit": float(total_revenue - total_expenses),
            "month_sales": float(month_sales),
            "month_expenses": float(month_expenses),
            "month_profit": float(month_sales - month_expenses)
        },
        "trends": {
            "monthly_sales": monthly_sales,
            "monthly_expenses": monthly_expenses
        },
        "top_ponds": top_ponds,
        "unit_wise_sales": unit_wise_sales,
        "pond_unit_breakdown": pond_unit_breakdown,
        "recent_activities": recent_activities
    }
