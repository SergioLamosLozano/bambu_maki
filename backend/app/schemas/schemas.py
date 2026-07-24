from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class OptionBase(BaseModel):
    name: str
    price: float
    category_id: int

class Option(OptionBase):
    id: int
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    is_multiple: bool
    required: bool
    max_selections: Optional[int]

class Category(CategoryBase):
    id: int
    options: List[Option] = []
    class Config:
        from_attributes = True

class ProductVariationBase(BaseModel):
    name: str
    price: float

class ProductVariation(ProductVariationBase):
    id: int
    class Config:
        from_attributes = True

class ProductTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    base_price: float
    image_url: Optional[str] = None

class ProductType(ProductTypeBase):
    id: int
    variations: List[ProductVariation] = []
    categories: List[Category] = []
    class Config:
        from_attributes = True

class DailyRollBase(BaseModel):
    day_of_week: int # 0=Monday, 6=Sunday
    product_type_id: int
    promotional_price: float

class DailyRoll(DailyRollBase):
    id: int
    class Config:
        from_attributes = True

# Request Payloads
class OrderItemOptionCreate(BaseModel):
    option_id: int

class OrderItemCreate(BaseModel):
    product_type_id: int
    variation_id: Optional[int] = None
    quantity: int
    options: List[OrderItemOptionCreate] = []

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    delivery_address: str
    items: List[OrderItemCreate]

# Response Models
class OrderItemOption(BaseModel):
    id: int
    option_id: int
    class Config:
        from_attributes = True

class OrderItem(BaseModel):
    id: int
    product_type_id: int
    variation_id: Optional[int] = None
    quantity: int
    options: List[OrderItemOption] = []
    class Config:
        from_attributes = True

class Order(BaseModel):
    id: UUID
    customer_name: str
    customer_phone: str
    delivery_address: str
    status: str
    total_amount: float
    created_at: datetime
    items: List[OrderItem] = []
    class Config:
        from_attributes = True

class DashboardKPIs(BaseModel):
    total_orders: int
    accepted_orders: int
    total_revenue: float
    weekly_revenue: List[dict] # {"day": "Mon", "revenue": 100}
    top_combo: Optional[str]
    top_individual: Optional[str]
