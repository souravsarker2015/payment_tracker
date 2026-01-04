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
    sale_items: List["FishSaleItem"] = Relationship(back_populates="unit")
    feed_purchases: List["PondFeedPurchase"] = Relationship(back_populates="unit")
    feed_usages: List["PondFeedUsage"] = Relationship(back_populates="unit")

class Pond(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    location: str
    size: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    labor_costs: List["LaborCost"] = Relationship(back_populates="pond")
    sale_items: List["FishSaleItem"] = Relationship(back_populates="pond")
    feed_purchases: List["PondFeedPurchase"] = Relationship(back_populates="pond")
    feed_usages: List["PondFeedUsage"] = Relationship(back_populates="pond")

class Supplier(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    transactions: List["SupplierTransaction"] = Relationship(back_populates="supplier")
    feed_purchases: List["PondFeedPurchase"] = Relationship(back_populates="supplier")

class SupplierTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    supplier_id: int = Field(foreign_key="supplier.id")
    date: datetime
    transaction_type: TransactionType
    amount: float
    description: Optional[str] = None
    
    # Relationships
    supplier: Optional[Supplier] = Relationship(back_populates="transactions")

class FishFeed(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    brand: Optional[str] = None
    description: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    purchases: List["PondFeedPurchase"] = Relationship(back_populates="feed")
    usages: List["PondFeedUsage"] = Relationship(back_populates="feed")

class PondFeedPurchase(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pond_id: Optional[int] = Field(default=None, foreign_key="pond.id", nullable=True)
    supplier_id: int = Field(foreign_key="supplier.id")
    feed_id: Optional[int] = Field(default=None, foreign_key="fishfeed.id", nullable=True) # Link to FishFeed
    date: datetime
    quantity: float
    unit_id: int = Field(foreign_key="unit.id")
    price_per_unit: float
    total_amount: float
    description: Optional[str] = None # Legacy/Notes
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    pond: Optional[Pond] = Relationship(back_populates="feed_purchases")
    supplier: Optional[Supplier] = Relationship(back_populates="feed_purchases")
    unit: Optional[Unit] = Relationship(back_populates="feed_purchases")
    feed: Optional[FishFeed] = Relationship(back_populates="purchases")

class PondFeedUsage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pond_id: int = Field(foreign_key="pond.id")
    feed_id: int = Field(foreign_key="fishfeed.id")
    date: datetime
    quantity: float
    unit_id: int = Field(foreign_key="unit.id")
    price_per_unit: float
    total_cost: float
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    pond: Optional[Pond] = Relationship(back_populates="feed_usages")
    feed: Optional[FishFeed] = Relationship(back_populates="usages")
    unit: Optional[Unit] = Relationship(back_populates="feed_usages")

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

class FishCategory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    fish: List["Fish"] = Relationship(back_populates="category")

class Fish(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category_id: Optional[int] = Field(default=None, foreign_key="fishcategory.id", nullable=True) # Optional category
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    category: Optional[FishCategory] = Relationship(back_populates="fish")
    sale_items: List["FishSaleItem"] = Relationship(back_populates="fish")

class FishBuyer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    sales: List["FishSale"] = Relationship(back_populates="buyer")
    transactions: List["FishBuyerTransaction"] = Relationship(back_populates="buyer")


class FishBuyerTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    buyer_id: int = Field(foreign_key="fishbuyer.id")
    date: datetime
    amount: float
    transaction_type: str = Field(description="payment (buyer pays money), due (buyer buys on credit)")
    note: Optional[str] = None
    user_id: int = Field(foreign_key="user.id")

    # Relationships
    buyer: Optional[FishBuyer] = Relationship(back_populates="transactions")

class FishSale(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: datetime
    buyer_name: Optional[str] = None # Legacy/Fallback
    buyer_id: Optional[int] = Field(default=None, foreign_key="fishbuyer.id", nullable=True)
    sale_type: str = Field(default="detailed")  # 'simple' or 'detailed'
    payment_status: str = Field(default="paid") # 'paid', 'due', 'partial'
    total_amount: float
    paid_amount: float = Field(default=0.0)
    due_amount: float = Field(default=0.0)
    total_weight: Optional[float] = None
    user_id: int = Field(foreign_key="user.id")
    
    # Relationships
    items: List["FishSaleItem"] = Relationship(back_populates="sale")
    buyer: Optional[FishBuyer] = Relationship(back_populates="sales")

class FishSaleItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="fishsale.id")
    pond_id: Optional[int] = Field(default=None, foreign_key="pond.id", nullable=True) # Optional pond
    fish_id: Optional[int] = Field(default=None, foreign_key="fish.id", nullable=True) # Link to Fish
    quantity: float  # Changed from weight_kg to quantity
    unit_id: int = Field(foreign_key="unit.id")  # Reference to Unit
    rate_per_unit: float  # Changed from rate_per_kg
    amount: float
    
    # Relationships
    sale: Optional[FishSale] = Relationship(back_populates="items")
    pond: Optional[Pond] = Relationship(back_populates="sale_items")
    unit: Optional[Unit] = Relationship(back_populates="sale_items")
    fish: Optional[Fish] = Relationship(back_populates="sale_items")
