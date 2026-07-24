from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, cast, text
from sqlalchemy.types import Date
from datetime import datetime, timedelta, date
import pytz

from app.models.models import Order, OrderItem, OrderStatus, ProductVariation

BOGOTA = pytz.timezone("America/Bogota")


def now_bogota() -> datetime:
    return datetime.now(BOGOTA)


async def get_analytics(db: AsyncSession) -> dict:
    now = now_bogota()

    # Rangos naive-UTC para filtros (Postgres guarda en UTC con timezone)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start  = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)
    fourteen_ago = today_start - timedelta(days=13)
    thirty_ago   = today_start - timedelta(days=29)

    # ── 1. Ingresos por día (últimos 14 días) ─────────────────────────────────
    # Convertimos el timestamp a fecha en Bogotá usando AT TIME ZONE con text()
    revenue_sql = text("""
        SELECT
            (created_at AT TIME ZONE 'America/Bogota')::date AS day,
            SUM(total_price)::int                             AS revenue,
            COUNT(id)::int                                    AS orders
        FROM orders
        WHERE status::text != 'cancelado'
          AND created_at >= :since
        GROUP BY day
        ORDER BY day
    """)
    rev_rows = await db.execute(revenue_sql, {"since": fourteen_ago})
    raw_revenue = [{"day": str(r.day), "revenue": r.revenue, "orders": r.orders}
                   for r in rev_rows.mappings()]

    # ── 2. Top productos (día / semana / mes) ─────────────────────────────────
    top_sql = text("""
        SELECT pv.name, SUM(oi.quantity)::int AS qty
        FROM order_items oi
        JOIN product_variations pv ON pv.id = oi.product_variation_id
        JOIN orders o              ON o.id  = oi.order_id
        WHERE o.status::text != 'cancelado'
          AND o.created_at >= :since
        GROUP BY pv.name
        ORDER BY qty DESC
        LIMIT 5
    """)

    async def top_products(since: datetime):
        rows = await db.execute(top_sql, {"since": since})
        return [{"name": r.name, "qty": r.qty} for r in rows.mappings()]

    top_day   = await top_products(today_start)
    top_week  = await top_products(week_start)
    top_month = await top_products(month_start)

    # ── 3. Pedidos por hora (últimos 30 días, hora Bogotá) ────────────────────
    hour_sql = text("""
        SELECT
            EXTRACT(HOUR FROM (created_at AT TIME ZONE 'America/Bogota'))::int AS hour,
            COUNT(id)::int AS count
        FROM orders
        WHERE status::text != 'cancelado'
          AND created_at >= :since
        GROUP BY hour
        ORDER BY hour
    """)
    hour_rows = await db.execute(hour_sql, {"since": thirty_ago})
    orders_by_hour = [{"hour": r.hour, "count": r.count} for r in hour_rows.mappings()]

    # ── 4. Split domicilio vs. recoger (mes actual) ───────────────────────────
    delivery_sql = text("""
        SELECT
            delivery_type::text          AS type,
            COUNT(id)::int               AS count,
            COALESCE(SUM(total_price), 0)::int AS revenue
        FROM orders
        WHERE status::text != 'cancelado'
          AND created_at >= :since
        GROUP BY delivery_type
    """)
    del_rows = await db.execute(delivery_sql, {"since": month_start})
    delivery_split = [{"type": r.type, "count": r.count, "revenue": r.revenue}
                      for r in del_rows.mappings()]

    # ── 5. Resumen (hoy / semana / mes) ───────────────────────────────────────
    summary_sql = text("""
        SELECT
            COUNT(CASE WHEN created_at >= :today  AND status::text != 'cancelado' THEN 1 END)::int            AS today_orders,
            COALESCE(SUM(CASE WHEN created_at >= :today  AND status::text != 'cancelado' THEN total_price END), 0)::int AS today_revenue,
            COUNT(CASE WHEN created_at >= :week   AND status::text != 'cancelado' THEN 1 END)::int            AS week_orders,
            COALESCE(SUM(CASE WHEN created_at >= :week   AND status::text != 'cancelado' THEN total_price END), 0)::int AS week_revenue,
            COUNT(CASE WHEN created_at >= :month  AND status::text != 'cancelado' THEN 1 END)::int            AS month_orders,
            COALESCE(SUM(CASE WHEN created_at >= :month  AND status::text != 'cancelado' THEN total_price END), 0)::int AS month_revenue
        FROM orders
    """)
    s = (await db.execute(summary_sql, {
        "today": today_start,
        "week":  week_start,
        "month": month_start,
    })).mappings().one()

    return {
        "revenue_by_day": raw_revenue,
        "top_day":        top_day,
        "top_week":       top_week,
        "top_month":      top_month,
        "orders_by_hour": orders_by_hour,
        "delivery_split": delivery_split,
        "summary": {
            "today_orders":   s["today_orders"],
            "today_revenue":  s["today_revenue"],
            "week_orders":    s["week_orders"],
            "week_revenue":   s["week_revenue"],
            "month_orders":   s["month_orders"],
            "month_revenue":  s["month_revenue"],
        },
    }
