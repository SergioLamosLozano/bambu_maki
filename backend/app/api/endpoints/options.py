from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid

from app.core.database import get_db
from app.models.models import Category, Option, ProductType
from app.schemas.options import CategoryCreate, CategoryResponse, OptionCreate, OptionResponse, OptionUpdate

router = APIRouter()

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).options(selectinload(Category.options)))
    categories = result.scalars().all()
    return categories

@router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, db: AsyncSession = Depends(get_db)):
    db_category = Category(
        name=category.name,
        product_type_id=category.product_type_id,
        is_required=category.is_required,
        max_selections=category.max_selections,
        is_active=category.is_active,
        allow_quantity=category.allow_quantity,
        options=[]
    )
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    return db_category

@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: uuid.UUID, category: CategoryCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category).options(selectinload(Category.options)).filter(Category.id == category_id)
    )
    db_category = result.scalars().first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_category.name = category.name
    db_category.product_type_id = category.product_type_id
    db_category.is_required = category.is_required
    db_category.max_selections = category.max_selections
    db_category.is_active = category.is_active
    db_category.allow_quantity = category.allow_quantity
    
    await db.commit()
    await db.refresh(db_category)
    return db_category

@router.delete("/categories/{category_id}")
async def delete_category(category_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).filter(Category.id == category_id))
    db_category = result.scalars().first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(db_category)
    await db.commit()
    return {"ok": True}

@router.post("/categories/{category_id}/options", response_model=OptionResponse)
async def create_option(category_id: uuid.UUID, option: OptionCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).filter(Category.id == category_id))
    db_category = result.scalars().first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db_option = Option(
        category_id=category_id,
        name=option.name,
        extra_price=option.extra_price,
        emoji=option.emoji,
        is_active=option.is_active
    )
    db.add(db_option)
    await db.commit()
    await db.refresh(db_option)
    return db_option

@router.put("/options/{option_id}", response_model=OptionResponse)
async def update_option(option_id: uuid.UUID, option: OptionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Option).filter(Option.id == option_id))
    db_option = result.scalars().first()
    if not db_option:
        raise HTTPException(status_code=404, detail="Option not found")
    
    if option.name is not None:
        db_option.name = option.name
    if option.extra_price is not None:
        db_option.extra_price = option.extra_price
    if option.is_active is not None:
        db_option.is_active = option.is_active
    
    await db.commit()
    await db.refresh(db_option)
    return db_option

@router.delete("/options/{option_id}")
async def delete_option(option_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Option).filter(Option.id == option_id))
    db_option = result.scalars().first()
    if not db_option:
        raise HTTPException(status_code=404, detail="Option not found")
    await db.delete(db_option)
    await db.commit()
    return {"ok": True}
