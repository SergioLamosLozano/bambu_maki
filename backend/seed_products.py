import asyncio
from sqlalchemy.future import select
from app.core.database import async_session
from app.models.models import ProductType, ProductVariation, Category, Option

async def seed_products():
    async with async_session() as db:
        try:
            # Check if we already seeded
            result = await db.execute(select(ProductType))
            if result.scalars().first():
                print("Products already seeded.")
                return

            print("Seeding products...")

            # Product Types
            rollo_type = ProductType(name="Rollo", slug="rollo", emoji="🍣")
            combo_type = ProductType(name="Combo", slug="combo", emoji="🍱")
            db.add_all([rollo_type, combo_type])
            await db.flush()

            # Product Variations - Rollos
            rollos = [
                ProductVariation(product_type_id=rollo_type.id, name="Filadelfia", description="Salmón, queso crema, aguacate", base_price=22000),
                ProductVariation(product_type_id=rollo_type.id, name="Ojo de Tigre", description="Atún, salmón, pargo, tempurizado", base_price=25000),
                ProductVariation(product_type_id=rollo_type.id, name="Maki Crocante", description="Langostino tempura, aguacate", base_price=24000),
                ProductVariation(product_type_id=rollo_type.id, name="Bambu Especial", description="El rollo del día a un precio especial", base_price=15000)
            ]
            
            # Product Variations - Combos
            combos = [
                ProductVariation(product_type_id=combo_type.id, name="Combo Pareja", description="2 Rollos + 2 Bebidas + 1 Entrada", base_price=45000),
                ProductVariation(product_type_id=combo_type.id, name="Bambu Familiar", description="4 Rollos + 4 Bebidas + 2 Entradas", base_price=85000)
            ]
            
            db.add_all(rollos + combos)
            await db.flush()

            # Option Categories for Rollos
            topping_cat = Category(product_type_id=rollo_type.id, name="Topping Especial", max_selections=1)
            salsa_cat = Category(product_type_id=rollo_type.id, name="Salsas Extra")
            db.add_all([topping_cat, salsa_cat])
            await db.flush()

            # Options
            options = [
                Option(category_id=topping_cat.id, name="Plátano Maduro", extra_price=2000),
                Option(category_id=topping_cat.id, name="Aguacate Extra", extra_price=2500),
                Option(category_id=salsa_cat.id, name="Salsa Anguila", extra_price=1500),
                Option(category_id=salsa_cat.id, name="Mayonesa Picante", extra_price=1500),
            ]
            db.add_all(options)
            
            await db.commit()
            print("Products seeded successfully.")
            
        except Exception as e:
            print(f"Error seeding products: {e}")

if __name__ == "__main__":
    asyncio.run(seed_products())
