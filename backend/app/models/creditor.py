from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User

class Creditor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = Field(default=None)
    creditor_type: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    user: Optional["User"] = Relationship(back_populates="creditors")
    transactions: List["Transaction"] = Relationship(back_populates="creditor")

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    creditor_id: Optional[int] = Field(default=None, foreign_key="creditor.id")
    amount: float
    type: str # "BORROW" or "REPAY"
    date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = Field(default=None)
    
    creditor: Optional[Creditor] = Relationship(back_populates="transactions")
