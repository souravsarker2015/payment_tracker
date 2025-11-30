from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    
    creditors: List["Creditor"] = Relationship(back_populates="user")

class Creditor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = Field(default=None)
    creditor_type: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    user: Optional[User] = Relationship(back_populates="creditors")
    transactions: List["Transaction"] = Relationship(back_populates="creditor")

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    creditor_id: Optional[int] = Field(default=None, foreign_key="creditor.id")
    amount: float
    type: str # "BORROW" or "REPAY"
    date: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = Field(default=None)
    
    creditor: Optional[Creditor] = Relationship(back_populates="transactions")
