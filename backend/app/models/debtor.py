from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User

class Debtor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = Field(default=None)
    debtor_type: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    user: Optional["User"] = Relationship(back_populates="debtors")
    transactions: List["DebtorTransaction"] = Relationship(back_populates="debtor")

class DebtorTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    debtor_id: Optional[int] = Field(default=None, foreign_key="debtor.id")
    amount: float
    type: str # "LEND" or "RECEIVE"
    date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = Field(default=None)
    
    debtor: Optional[Debtor] = Relationship(back_populates="transactions")
