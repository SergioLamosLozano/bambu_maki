from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from app.models.models import DeliveryType, OrderStatus

class OrderItemOptionCreate(BaseModel):
    option_id: UUID

class VariationSimple(BaseModel):
    name: str
    model_config = ConfigDict(from_attributes=True)

class OptionSimple(BaseModel):
    name: str
    model_config = ConfigDict(from_attributes=True)

class OrderItemCreate(BaseModel):
    product_variation_id: UUID
    quantity: int = 1
    subtotal: int
    notes: Optional[str] = None
    selected_options: List[OrderItemOptionCreate] = []

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_address: Optional[str] = None
    delivery_type: DeliveryType
    delivery_cost: int = 0
    total_price: int
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderItemOptionResponse(BaseModel):
    id: UUID
    option_id: UUID
    option: OptionSimple

    
    model_config = ConfigDict(from_attributes=True)

class OrderItemResponse(BaseModel):
    id: UUID
    product_variation_id: UUID
    quantity: int
    subtotal: int
    notes: Optional[str] = None
    variation: VariationSimple
    selected_options: List[OrderItemOptionResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: UUID
    order_number: Optional[int] = None
    customer_name: str
    customer_phone: str
    customer_address: Optional[str] = None
    delivery_type: DeliveryType
    delivery_cost: int
    total_price: int
    status: OrderStatus
    created_at: datetime
    items: List[OrderItemResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class OrderStats(BaseModel):
    today_orders: int
    pending_orders: int
    accepted_orders: int
    cancelled_orders: int
    today_revenue: int
