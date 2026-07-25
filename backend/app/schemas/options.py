from pydantic import BaseModel, UUID4
from typing import List, Optional
import uuid

class OptionBase(BaseModel):
    name: str
    extra_price: int = 0
    emoji: Optional[str] = None
    is_active: bool = True

class OptionCreate(OptionBase):
    pass

class OptionUpdate(BaseModel):
    name: Optional[str] = None
    extra_price: Optional[int] = None
    is_active: Optional[bool] = None

class OptionResponse(OptionBase):
    id: UUID4
    category_id: UUID4

    class Config:
        orm_mode = True

class CategoryBase(BaseModel):
    name: str
    product_type_id: Optional[UUID4] = None
    is_required: bool = False
    max_selections: Optional[int] = None
    is_active: bool = True
    allow_quantity: bool = False

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: UUID4
    options: List[OptionResponse] = []

    class Config:
        orm_mode = True
