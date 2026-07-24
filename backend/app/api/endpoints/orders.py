from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session
from app.schemas.orders import OrderCreate, OrderResponse, OrderStats, OrderStatusUpdate
from app.services.order_service import create_order, get_orders, get_order_stats, update_order_status
from app.services.analytics_service import get_analytics
from uuid import UUID

router = APIRouter()

async def get_db():
    async with async_session() as session:
        yield session

@router.get("/", response_model=List[OrderResponse])
async def list_orders(db: AsyncSession = Depends(get_db)):
    return await get_orders(db)

@router.get("/stats", response_model=OrderStats)
async def fetch_order_stats(db: AsyncSession = Depends(get_db)):
    return await get_order_stats(db)

@router.get("/analytics")
async def fetch_analytics(db: AsyncSession = Depends(get_db)):
    return await get_analytics(db)

@router.post("/", response_model=OrderResponse)
async def place_order(order: OrderCreate, db: AsyncSession = Depends(get_db)):
    return await create_order(db, order)

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_status(order_id: UUID, status_data: OrderStatusUpdate, db: AsyncSession = Depends(get_db)):
    return await update_order_status(db, order_id, status_data)
