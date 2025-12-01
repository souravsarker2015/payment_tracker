from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

# --- Enums ---

class TransactionType(str, Enum):
    purchase_cash = "purchase_cash"
    purchase_credit = "purchase_credit"
    payment = "payment"

# --- Models ---

class Pond(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    location: str
    size: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    labor_costs: List["LaborCost"] = Relationship(back_populates="pond")
    sale_items: List["FishSaleItem"] = Relationship(back_populates="pond")

class Supplier(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    transactions: List["SupplierTransaction"] = Relationship(back_populates="supplier")

class SupplierTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    supplier_id: int = Field(foreign_key="supplier.id")
    date: datetime
    transaction_type: TransactionType
    amount: float
    description: Optional[str] = None
    
    # Relationships
    supplier: Optional[Supplier] = Relationship(back_populates="transactions")

class LaborCost(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: datetime
    amount: float
    worker_count: int
    description: Optional[str] = None
    pond_id: Optional[int] = Field(default=None, foreign_key="pond.id")
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    pond: Optional[Pond] = Relationship(back_populates="labor_costs")

class FishSale(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: datetime
    buyer_name: Optional[str] = None
    total_amount: float
    total_weight: Optional[float] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    items: List["FishSaleItem"] = Relationship(back_populates="sale")

class FishSaleItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="fishsale.id")
    pond_id: int = Field(foreign_key="pond.id")
    weight_kg: float
    rate_per_kg: float
    amount: float
    
    # Relationships
    sale: Optional[FishSale] = Relationship(back_populates="items")
    pond: Optional[Pond] = Relationship(back_populates="sale_items")
