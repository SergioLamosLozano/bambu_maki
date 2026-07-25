import uuid
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, DateTime, func, Enum, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base

class DeliveryType(str, enum.Enum):
    domicilio = "domicilio"
    recoger = "recoger"

class OrderStatus(str, enum.Enum):
    pendiente = "pendiente"
    preparando = "preparando"
    en_camino = "en_camino"
    entregado = "entregado"
    cancelado = "cancelado"

class ProductType(Base):
    __tablename__ = 'product_types'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    emoji = Column(String)
    is_active = Column(Boolean, default=True)

    variations = relationship("ProductVariation", back_populates="product_type")
    categories = relationship("Category", back_populates="product_type")

class ProductVariation(Base):
    __tablename__ = 'product_variations'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_type_id = Column(UUID(as_uuid=True), ForeignKey('product_types.id'), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    base_price = Column(Integer, nullable=False)
    includes_rolls = Column(Integer, default=0)

    product_type = relationship("ProductType", back_populates="variations")

class Category(Base):
    __tablename__ = 'categories'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_type_id = Column(UUID(as_uuid=True), ForeignKey('product_types.id'), nullable=True) # If null, applies to all
    name = Column(String, nullable=False)
    is_required = Column(Boolean, default=False)
    max_selections = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    allow_quantity = Column(Boolean, default=False)

    product_type = relationship("ProductType", back_populates="categories")
    options = relationship("Option", back_populates="category")

class Option(Base):
    __tablename__ = 'options'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey('categories.id'), nullable=False)
    name = Column(String, nullable=False)
    extra_price = Column(Integer, default=0)
    emoji = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    category = relationship("Category", back_populates="options")

class Order(Base):
    __tablename__ = 'orders'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(Integer, server_default=text("nextval('order_number_seq')"), nullable=True)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_address = Column(String, nullable=True)
    delivery_type = Column(Enum(DeliveryType), nullable=False)
    delivery_cost = Column(Integer, default=0)
    total_price = Column(Integer, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.pendiente)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = 'order_items'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey('orders.id'), nullable=False)
    product_variation_id = Column(UUID(as_uuid=True), ForeignKey('product_variations.id'), nullable=False)
    quantity = Column(Integer, default=1)
    subtotal = Column(Integer, nullable=False)
    notes = Column(String, nullable=True)

    order = relationship("Order", back_populates="items")
    variation = relationship("ProductVariation")
    selected_options = relationship("OrderItemOption", back_populates="order_item")

class OrderItemOption(Base):
    __tablename__ = 'order_item_options'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_item_id = Column(UUID(as_uuid=True), ForeignKey('order_items.id'), nullable=False)
    option_id = Column(UUID(as_uuid=True), ForeignKey('options.id'), nullable=False)

    order_item = relationship("OrderItem", back_populates="selected_options")
    option = relationship("Option")

class DailyRoll(Base):
    __tablename__ = 'daily_rolls'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    day_of_week = Column(Integer, nullable=False, unique=True) # 0=Monday, 6=Sunday
    product_variation_id = Column(UUID(as_uuid=True), ForeignKey('product_variations.id'), nullable=False)
    discount_price = Column(Integer, nullable=False)
    variation = relationship("ProductVariation")

class StoreSettings(Base):
    __tablename__ = 'store_settings'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, unique=True, nullable=False)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)

class UserRole(str, enum.Enum):
    admin = "admin"
    superadmin = "superadmin"

class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.admin)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
