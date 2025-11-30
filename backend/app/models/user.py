from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .creditor import Creditor
    from .debtor import Debtor

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    
    creditors: List["Creditor"] = Relationship(back_populates="user")
    debtors: List["Debtor"] = Relationship(back_populates="user")
