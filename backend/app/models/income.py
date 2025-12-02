from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .user import User

class Person(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = Field(default=None)
    designation: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    user: Optional["User"] = Relationship(back_populates="persons")
    incomes: List["Income"] = Relationship(back_populates="person")

class Organization(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    address: Optional[str] = Field(default=None)
    contact_person: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    user: Optional["User"] = Relationship(back_populates="organizations")
    incomes: List["Income"] = Relationship(back_populates="organization")

class Income(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    person_id: int = Field(foreign_key="person.id")
    organization_id: int = Field(foreign_key="organization.id")
    amount: float
    date: datetime = Field(default_factory=datetime.utcnow)
    income_type: str = Field(default="SALARY")  # SALARY, BONUS, COMMISSION, ALLOWANCE, OTHER
    note: Optional[str] = Field(default=None)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    user: Optional["User"] = Relationship(back_populates="incomes")
    person: Optional[Person] = Relationship(back_populates="incomes")
    organization: Optional[Organization] = Relationship(back_populates="incomes")
