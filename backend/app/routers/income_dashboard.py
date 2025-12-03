from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from app.database import get_session
from app.auth import get_current_user
from app.models import User
from app.models.income import Income, Organization, Person
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/income-dashboard", tags=["income-dashboard"])

@router.get("/stats")
def get_income_dashboard_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get comprehensive statistics for income dashboard with filtering"""
    
    now = datetime.now()
    
    # Parse dates
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
            
    # Base query filters
    def apply_filters(query):
        query = query.where(Income.user_id == current_user.id)
        if filter_start:
            query = query.where(Income.date >= filter_start)
        if filter_end:
            query = query.where(Income.date <= filter_end)
        return query

    # 1. Summary Stats
    # Total Income (Filtered)
    total_income_query = select(func.sum(Income.amount))
    total_income = session.exec(apply_filters(total_income_query)).one() or 0
    
    # This Month's Income (Always current month for context, or filtered if we want strict mode)
    # Let's keep "This Month" as actual current month for context, 
    # but maybe we should also return "Average Monthly" for the selected period?
    # For now, let's keep the original "This Month" / "Last Month" as they are useful context.
    
    month_start = datetime(now.year, now.month, 1)
    month_income = session.exec(
        select(func.sum(Income.amount))
        .where(Income.user_id == current_user.id)
        .where(Income.date >= month_start)
    ).one() or 0
    
    last_month_date = now - timedelta(days=now.day + 1)
    last_month_start = datetime(last_month_date.year, last_month_date.month, 1)
    last_month_end = datetime(now.year, now.month, 1)
    
    last_month_income = session.exec(
        select(func.sum(Income.amount))
        .where(Income.user_id == current_user.id)
        .where(Income.date >= last_month_start)
        .where(Income.date < last_month_end)
    ).one() or 0

    # 2. Trends
    # If filter is applied, show trend within that range (monthly aggregation)
    # If no filter, show last 12 months
    
    monthly_trend = []
    
    if filter_start and filter_end:
        # Strip timezone info to avoid comparison issues with naive datetimes
        filter_start_naive = filter_start.replace(tzinfo=None)
        filter_end_naive = filter_end.replace(tzinfo=None)
        
        # Generate months between start and end
        curr = filter_start_naive
        while curr <= filter_end_naive:
            # Start of this month
            m_start = datetime(curr.year, curr.month, 1)
            # Start of next month
            if curr.month == 12:
                m_end = datetime(curr.year + 1, 1, 1)
            else:
                m_end = datetime(curr.year, curr.month + 1, 1)
            
            # Query for this month
            amount = session.exec(
                select(func.sum(Income.amount))
                .where(Income.user_id == current_user.id)
                .where(Income.date >= m_start)
                .where(Income.date < m_end)
            ).one() or 0
            
            monthly_trend.append({
                "month": m_start.strftime("%b %Y"),
                "amount": float(amount)
            })
            
            # Move to next month
            curr = m_end
            
    else:
        # No filter: Show all income data grouped by month
        # Get all income records for this user
        all_incomes = session.exec(
            select(Income)
            .where(Income.user_id == current_user.id)
            .order_by(Income.date)
        ).all()
        
        if all_incomes:
            # Group by month
            monthly_data = {}
            for income in all_incomes:
                month_key = income.date.strftime("%Y-%m")
                month_label = income.date.strftime("%b %Y")
                if month_key not in monthly_data:
                    monthly_data[month_key] = {"month": month_label, "amount": 0}
                monthly_data[month_key]["amount"] += income.amount
            
            # Convert to list and sort by month
            monthly_trend = sorted(
                [{"month": v["month"], "amount": float(v["amount"])} for v in monthly_data.values()],
                key=lambda x: datetime.strptime(x["month"], "%b %Y")
            )

    # 3. Breakdown by Income Type
    type_breakdown_query = select(Income.income_type, func.sum(Income.amount))
    type_breakdown_query = apply_filters(type_breakdown_query)
    type_breakdown_query = type_breakdown_query.group_by(Income.income_type)
    
    type_breakdown_data = session.exec(type_breakdown_query).all()
    
    by_type = [
        {"name": income_type, "value": float(amount)}
        for income_type, amount in type_breakdown_data
    ]

    # 4. Breakdown by Organization (Top 5)
    org_breakdown_query = (
        select(Organization.name, func.sum(Income.amount))
        .join(Income, Income.organization_id == Organization.id)
    )
    org_breakdown_query = apply_filters(org_breakdown_query)
    org_breakdown_query = (
        org_breakdown_query
        .group_by(Organization.name)
        .order_by(func.sum(Income.amount).desc())
        .limit(5)
    )
    org_breakdown_data = session.exec(org_breakdown_query).all()
    
    by_organization = [
        {"name": name, "value": float(amount)}
        for name, amount in org_breakdown_data
    ]

    # 5. Breakdown by Person (Top 5)
    person_breakdown_query = (
        select(Person.name, func.sum(Income.amount))
        .join(Income, Income.person_id == Person.id)
    )
    person_breakdown_query = apply_filters(person_breakdown_query)
    person_breakdown_query = (
        person_breakdown_query
        .group_by(Person.name)
        .order_by(func.sum(Income.amount).desc())
        .limit(5)
    )
    person_breakdown_data = session.exec(person_breakdown_query).all()
    
    by_person = [
        {"name": name, "value": float(amount)}
        for name, amount in person_breakdown_data
    ]

    return {
        "summary": {
            "total_income": float(total_income),
            "month_income": float(month_income),
            "last_month_income": float(last_month_income)
        },
        "trends": monthly_trend,
        "charts": {
            "by_type": by_type,
            "by_organization": by_organization,
            "by_person": by_person
        }
    }
