from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import products, orders, settings, options, auth, upload

app = FastAPI(title="Bambu Maki API", description="API for DeliSushi orders")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to Bambu Maki API"}

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(options.router, prefix="/api/options", tags=["options"])
