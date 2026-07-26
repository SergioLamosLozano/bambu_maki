from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel, UUID4

from app.core.database import get_db
from app.models.models import ProductType, ProductVariation, User, DailyRoll
from app.api.endpoints.auth import get_current_user
from datetime import datetime

router = APIRouter()

class VariationCreate(BaseModel):
    product_type_id: UUID4
    name: str
    base_price: int
    description: Optional[str] = None
    image_url: Optional[str] = None
    includes_rolls: Optional[int] = 0
    is_active: Optional[bool] = True

class VariationUpdate(BaseModel):
    name: Optional[str] = None
    base_price: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    includes_rolls: Optional[int] = None
    is_active: Optional[bool] = None

class VariationResponse(BaseModel):
    id: UUID4
    name: str
    base_price: int
    description: Optional[str] = None
    image_url: Optional[str] = None
    includes_rolls: Optional[int] = 0
    is_active: Optional[bool] = True
    product_type_id: UUID4
    
    class Config:
        from_attributes = True

class DailyRollUpdate(BaseModel):
    day_of_week: int
    product_variation_id: UUID4
    discount_price: int

class DailyRollResponse(BaseModel):
    id: UUID4
    day_of_week: int
    product_variation_id: UUID4
    discount_price: int
    variation: Optional[VariationResponse] = None

    class Config:
        from_attributes = True

class ProductTypeResponse(BaseModel):
    id: UUID4
    name: str
    slug: str
    emoji: Optional[str] = None
    variations: List[VariationResponse]
    
    class Config:
        from_attributes = True

from sqlalchemy import select, or_

@router.get("/", response_model=List[ProductTypeResponse])
async def get_all_products(admin: bool = False, db: AsyncSession = Depends(get_db)):
    if admin:
        result = await db.execute(
            select(ProductType)
            .options(selectinload(ProductType.variations))
            .filter(ProductType.is_active == True)
        )
    else:
        result = await db.execute(
            select(ProductType)
            .options(selectinload(ProductType.variations.and_(
                or_(ProductVariation.is_active == True, ProductVariation.is_active.is_(None))
            )))
            .filter(ProductType.is_active == True)
        )
    return result.scalars().all()

@router.post("/variations", response_model=VariationResponse)
async def create_variation(
    variation_in: VariationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    variation = ProductVariation(
        product_type_id=variation_in.product_type_id,
        name=variation_in.name,
        base_price=variation_in.base_price,
        description=variation_in.description,
        image_url=variation_in.image_url,
        includes_rolls=variation_in.includes_rolls,
        is_active=variation_in.is_active
    )
    db.add(variation)
    await db.commit()
    await db.refresh(variation)
    return variation

@router.put("/variations/{variation_id}", response_model=VariationResponse)
async def update_variation(
    variation_id: UUID4, 
    variation_in: VariationUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ProductVariation).filter(ProductVariation.id == variation_id))
    variation = result.scalars().first()
    if not variation:
        raise HTTPException(status_code=404, detail="Product variation not found")
        
    if variation_in.name is not None:
        variation.name = variation_in.name
    if variation_in.base_price is not None:
        variation.base_price = variation_in.base_price
    if variation_in.description is not None:
        variation.description = variation_in.description
    if variation_in.image_url is not None:
        variation.image_url = variation_in.image_url
    if variation_in.includes_rolls is not None:
        variation.includes_rolls = variation_in.includes_rolls
    if variation_in.is_active is not None:
        variation.is_active = variation_in.is_active
        
    await db.commit()
    await db.refresh(variation)
    return variation

from sqlalchemy.exc import IntegrityError

@router.delete("/variations/{variation_id}")
async def delete_variation(
    variation_id: UUID4,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ProductVariation).filter(ProductVariation.id == variation_id))
    variation = result.scalars().first()
    if not variation:
        raise HTTPException(status_code=404, detail="Product variation not found")
        
    try:
        await db.delete(variation)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar este producto porque está ligado a pedidos anteriores. Desactívalo en su lugar."
        )
    return {"ok": True}

@router.get("/daily_rolls", response_model=List[DailyRollResponse])
async def get_daily_rolls(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DailyRoll).options(selectinload(DailyRoll.variation)))
    return result.scalars().all()

@router.put("/daily_rolls", response_model=List[DailyRollResponse])
async def update_daily_rolls(
    rolls_in: List[DailyRollUpdate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Clear existing and add new
    await db.execute(DailyRoll.__table__.delete())
    new_rolls = []
    for roll in rolls_in:
        new_roll = DailyRoll(
            day_of_week=roll.day_of_week,
            product_variation_id=roll.product_variation_id,
            discount_price=roll.discount_price
        )
        db.add(new_roll)
        new_rolls.append(new_roll)
    
    await db.commit()
    
    result = await db.execute(select(DailyRoll).options(selectinload(DailyRoll.variation)))
    return result.scalars().all()

from datetime import datetime, timezone, timedelta

@router.get("/daily_roll/today", response_model=Optional[DailyRollResponse])
async def get_daily_roll_today(db: AsyncSession = Depends(get_db)):
    colombia_tz = timezone(timedelta(hours=-5))
    today = datetime.now(colombia_tz).weekday() # 0 = Monday, 6 = Sunday
    result = await db.execute(
        select(DailyRoll)
        .options(selectinload(DailyRoll.variation))
        .filter(DailyRoll.day_of_week == today)
    )
    return result.scalars().first()
