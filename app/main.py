from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware

from .database import engine, Base
from . import models
from .routers import auth, products, ai, admin, profile, orders, store, payment, categories, branding

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Multi-Tenant E-Commerce Platform",
    description="A whitelabel e-commerce solution using FastAPI and PostgreSQL.",
    version="0.1.0"
)

# Add CORS middleware
origins = [
    "http://localhost",
    "http://localhost:3000",  # Allow your React app to access the backend
    "http://127.0.0.1:3000",  # Alternative localhost
    "http://localhost:3001",  # Alternative port
    "*"  # Allow all origins for development (remove in production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Setup Jinja2 templates
templates = Jinja2Templates(directory="app/templates")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(ai.router, prefix="/ai", tags=["Generative AI"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(profile.router)
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(store.router, prefix="/store", tags=["Customer Store"])
app.include_router(payment.router, prefix="/payment", tags=["Payment Processing"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(branding.router, prefix="/branding", tags=["Tenant Branding"])

