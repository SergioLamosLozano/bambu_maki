from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.models.models import StoreSettings, User
from app.api.endpoints.auth import get_current_user

router = APIRouter()

class SettingUpdate(BaseModel):
    value: str

class SettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[SettingResponse])
async def get_all_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StoreSettings))
    settings = list(result.scalars().all())
    
    # Auto-create defaults if missing
    settings_dict = {s.key: s for s in settings}
    defaults = [
        StoreSettings(key="delivery_cost", value="3000", description="Costo de domicilio por defecto"),
        StoreSettings(key="whatsapp_template", value="¡Hola! Tu pedido en Bambu Maki ha sido ACEPTADO y ya lo estamos preparando. 🎉", description="Plantilla base para WhatsApp")
    ]
    
    for default_setting in defaults:
        if default_setting.key not in settings_dict:
            db.add(default_setting)
            settings.append(default_setting)
    
    await db.commit()
    for s in settings:
        if s in db.new:
            await db.refresh(s)
            
    return settings

@router.get("/{key}", response_model=SettingResponse)
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StoreSettings).filter(StoreSettings.key == key))
    setting = result.scalars().first()
    if not setting:
        if key == "delivery_cost":
            setting = StoreSettings(key="delivery_cost", value="3000", description="Costo de domicilio por defecto")
        elif key == "whatsapp_template":
            setting = StoreSettings(key="whatsapp_template", value="¡Hola! Tu pedido en Bambu Maki ha sido ACEPTADO y ya lo estamos preparando. 🎉", description="Plantilla base para WhatsApp")
        else:
            raise HTTPException(status_code=404, detail="Setting not found")
        
        db.add(setting)
        await db.commit()
        await db.refresh(setting)
    return setting

@router.put("/{key}", response_model=SettingResponse)
async def update_setting(key: str, setting_in: SettingUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(StoreSettings).filter(StoreSettings.key == key))
    setting = result.scalars().first()
    if not setting:
        setting = StoreSettings(key=key, value=setting_in.value)
        db.add(setting)
    else:
        setting.value = setting_in.value
    await db.commit()
    await db.refresh(setting)
    return setting
