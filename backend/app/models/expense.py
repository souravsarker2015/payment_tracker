from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User

class ExpenseType(SQLModel, table=True):
    __tablename__ = "expense_type"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    is_active: bool = Field(default=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    user: Optional["User"] = Relationship(back_populates="expense_types")
    expenses: List["Expense"] = Relationship(back_populates="expense_type")

class Expense(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    amount: float
    description: Optional[str] = Field(default=None)
    date: datetime = Field(default_factory=datetime.utcnow)
    expense_type_id: Optional[int] = Field(default=None, foreign_key="expense_type.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    user: Optional["User"] = Relationship(back_populates="expenses")
    expense_type: Optional[ExpenseType] = Relationship(back_populates="expenses")
