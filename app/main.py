from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from .database import engine, Base
from . import models
from .routers import auth, products, ai, admin, profile, orders, store, payment, categories, branding, hero_banners

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Multi-Tenant E-Commerce Platform",
    description="A whitelabel e-commerce solution using FastAPI and PostgreSQL.",
    version="0.1.0"
)

# Add CORS middleware - allow requests from your frontend domain
origins = [
    "http://localhost",
    "http://localhost:3000",  # Allow your React app to access the backend
    "http://127.0.0.1:3000",  # Alternative localhost
    "http://localhost:3001",  # Alternative port
    "https://gensg.tanfamily.cc",  # Your frontend domain
    "https://gensg-fastapi.tanfamily.cc",  # Your backend API domain
    "*"  # Allow all origins for development (remove in production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a middleware to log all incoming requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Setup Jinja2 templates
templates = Jinja2Templates(directory="app/templates")

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(products.router, tags=["Products"])
app.include_router(ai.router, tags=["Generative AI"])
app.include_router(admin.router, tags=["Admin"])
app.include_router(profile.router)
app.include_router(orders.router, tags=["Orders"])
app.include_router(store.router, tags=["Customer Store"])
app.include_router(payment.router, tags=["Payment Processing"])
app.include_router(categories.router, tags=["Categories"])
app.include_router(branding.router, tags=["Tenant Branding"])
app.include_router(hero_banners.router, tags=["Hero Banners"])

# Root endpoint
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "title": "Multi-Tenant E-Commerce Platform",
        "version": "0.1.0"
    })

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Multi-Tenant E-Commerce Platform is running"}

