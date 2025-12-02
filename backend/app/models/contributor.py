from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User

class Contributor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = Field(default=None)
    contributor_type: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    user: Optional["User"] = Relationship(back_populates="contributors")
    transactions: List["ContributorTransaction"] = Relationship(back_populates="contributor")

class ContributorTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    contributor_id: Optional[int] = Field(default=None, foreign_key="contributor.id")
    amount: float
    type: str # "CONTRIBUTE" or "RETURN"
    date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = Field(default=None)
    
    contributor: Optional[Contributor] = Relationship(back_populates="transactions")
