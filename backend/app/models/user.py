from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .creditor import Creditor
    from .debtor import Debtor
    from .contributor import Contributor
    from .expense import Expense, ExpenseType

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    
    creditors: List["Creditor"] = Relationship(back_populates="user")
    debtors: List["Debtor"] = Relationship(back_populates="user")
    expense_types: List["ExpenseType"] = Relationship(back_populates="user")
    expenses: List["Expense"] = Relationship(back_populates="user")
    contributors: List["Contributor"] = Relationship(back_populates="user")
