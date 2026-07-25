import os
import uuid
import time
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from supabase import create_client, Client
from app.models.models import User
from app.api.endpoints.auth import get_current_user

router = APIRouter()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

@router.post("/")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured.")
        
    file_extension = file.filename.split(".")[-1]
    file_name = f"{int(time.time())}_{uuid.uuid4()}.{file_extension}"
    
    file_bytes = await file.read()
    
    try:
        response = supabase.storage.from_("productos").upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        public_url = supabase.storage.from_("productos").get_public_url(file_name)
        return {"url": public_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")
