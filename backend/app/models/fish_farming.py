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

class Unit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str  # e.g., "kg", "mon", "pcs", "ton"
    name_bn: Optional[str] = None  # Bengali name, e.g., "কেজি", "মণ", "পিস", "টন"
    is_default: bool = False  # True for system defaults
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")  # Null for defaults
    
    # Relationships
    sale_items: List["FishSaleItem"] = Relationship(back_populates="unit")
    pond_feeds: List["PondFeed"] = Relationship(back_populates="unit")

class Pond(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    location: str
    size: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    labor_costs: List["LaborCost"] = Relationship(back_populates="pond")
    sale_items: List["FishSaleItem"] = Relationship(back_populates="pond")
    pond_feeds: List["PondFeed"] = Relationship(back_populates="pond")

class Supplier(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    transactions: List["SupplierTransaction"] = Relationship(back_populates="supplier")
    pond_feeds: List["PondFeed"] = Relationship(back_populates="supplier")

class SupplierTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    supplier_id: int = Field(foreign_key="supplier.id")
    date: datetime
    transaction_type: TransactionType
    amount: float
    description: Optional[str] = None
    
    # Relationships
    supplier: Optional[Supplier] = Relationship(back_populates="transactions")

class PondFeed(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pond_id: int = Field(foreign_key="pond.id")
    supplier_id: int = Field(foreign_key="supplier.id")
    date: datetime
    quantity: float
    unit_id: int = Field(foreign_key="unit.id")
    price_per_unit: float
    total_amount: float
    description: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    pond: Optional[Pond] = Relationship(back_populates="pond_feeds")
    supplier: Optional[Supplier] = Relationship(back_populates="pond_feeds")
    unit: Optional[Unit] = Relationship(back_populates="pond_feeds")

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
    sale_type: str = Field(default="detailed")  # 'simple' or 'detailed'
    total_amount: float
    total_weight: Optional[float] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    items: List["FishSaleItem"] = Relationship(back_populates="sale")

class FishSaleItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="fishsale.id")
    pond_id: int = Field(foreign_key="pond.id")
    quantity: float  # Changed from weight_kg to quantity
    unit_id: int = Field(foreign_key="unit.id")  # Reference to Unit
    rate_per_unit: float  # Changed from rate_per_kg
    amount: float
    
    # Relationships
    sale: Optional[FishSale] = Relationship(back_populates="items")
    pond: Optional[Pond] = Relationship(back_populates="sale_items")
    unit: Optional[Unit] = Relationship(back_populates="sale_items")
