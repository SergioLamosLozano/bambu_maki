import asyncio
from sqlalchemy.future import select
from app.core.database import async_session
from app.models.models import User, UserRole
from app.core.security import get_password_hash

async def seed_admin():
    async with async_session() as db:
        try:
            admin_email = "admin@bambumaki.com"
            admin_pass = "Bambumaki990806*"
            
            result = await db.execute(select(User).filter(User.email == admin_email))
            user = result.scalars().first()
            if not user:
                print(f"Creating admin user {admin_email}...")
                hashed_password = get_password_hash(admin_pass)
                new_admin = User(
                    email=admin_email,
                    hashed_password=hashed_password,
                    role=UserRole.superadmin
                )
                db.add(new_admin)
                await db.commit()
                print("Admin user created successfully.")
            else:
                print(f"Admin user {admin_email} already exists.")
                
        except Exception as e:
            print(f"Error seeding admin: {e}")

if __name__ == "__main__":
    asyncio.run(seed_admin())
