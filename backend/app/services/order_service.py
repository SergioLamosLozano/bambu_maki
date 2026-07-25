from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from datetime import datetime
from app.models.models import Order, OrderItem, OrderItemOption, OrderStatus
from app.schemas.orders import OrderCreate, OrderStatusUpdate
import pytz

async def get_orders(db: AsyncSession):
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.variation),
            selectinload(Order.items).selectinload(OrderItem.selected_options).selectinload(OrderItemOption.option)
        )
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()

async def get_order_stats(db: AsyncSession):
    today = datetime.now(pytz.timezone('America/Bogota')).date()
    
    orders = await get_orders(db)
    
    today_orders = 0
    pending_orders = 0
    accepted_orders = 0
    cancelled_orders = 0
    today_revenue = 0
    
    for order in orders:
        # Convert created_at to local date if it's aware, or just compare dates
        order_date = order.created_at.astimezone(pytz.timezone('America/Bogota')).date() if order.created_at.tzinfo else order.created_at.date()
        
        if order_date == today:
            today_orders += 1
            if order.status != OrderStatus.pendiente and order.status != OrderStatus.cancelado:
                # We can consider 'preparando', 'en_camino', 'entregado' as accepted revenue
                today_revenue += order.total_price
        
            if order.status == OrderStatus.pendiente:
                pending_orders += 1
            elif order.status in [OrderStatus.preparando, OrderStatus.en_camino, OrderStatus.entregado]:
                accepted_orders += 1
            elif order.status == OrderStatus.cancelado:
                cancelled_orders += 1
            
    return {
        "today_orders": today_orders,
        "pending_orders": pending_orders,
        "accepted_orders": accepted_orders,
        "cancelled_orders": cancelled_orders,
        "today_revenue": today_revenue
    }


async def update_order_status(db: AsyncSession, order_id, status_data: OrderStatusUpdate):
    order = await db.get(Order, order_id)
    if order:
        order.status = status_data.status
        await db.commit()
        # Re-fetch with all relationships eagerly loaded (avoids MissingGreenlet on serialization)
        result = await db.execute(
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.variation),
                selectinload(Order.items).selectinload(OrderItem.selected_options).selectinload(OrderItemOption.option)
            )
            .filter(Order.id == order_id)
        )
        return result.scalars().first()
    return order


async def create_order(db: AsyncSession, order_data: OrderCreate) -> Order:
    new_order = Order(
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        customer_address=order_data.customer_address,
        delivery_type=order_data.delivery_type,
        delivery_cost=order_data.delivery_cost,
        total_price=order_data.total_price,
        status=OrderStatus.pendiente
    )
    db.add(new_order)
    await db.flush()
    
    for item in order_data.items:
        new_item = OrderItem(
            order_id=new_order.id,
            product_variation_id=item.product_variation_id,
            quantity=item.quantity,
            subtotal=item.subtotal,
            notes=item.notes
        )
        db.add(new_item)
        await db.flush()
        
        for opt in item.selected_options:
            new_opt = OrderItemOption(
                order_item_id=new_item.id,
                option_id=opt.option_id
            )
            db.add(new_opt)
            
    await db.commit()
    await db.refresh(new_order)
    
    # Reload with relationships
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.variation),
            selectinload(Order.items).selectinload(OrderItem.selected_options).selectinload(OrderItemOption.option)
        )
        .filter(Order.id == new_order.id)
    )
    return result.scalars().first()
