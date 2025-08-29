from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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

# Environment-specific CORS configuration
def get_cors_origins():
    environment = os.getenv("ENVIRONMENT", "development")
    
    if environment == "production":
        # In production, allow specific domains plus any custom domain from env var
        allowed_origins = [
            "https://gen-capstone.tanfamily.cc",  # Default production domain
            "https://gensg.tanfamily.cc",         # Legacy domain if needed
        ]
        
        # Allow custom frontend domain via environment variable
        custom_domain = os.getenv("FRONTEND_DOMAIN")
        if custom_domain:
            # Support both http and https for the custom domain
            allowed_origins.extend([
                f"https://{custom_domain}",
                f"http://{custom_domain}",
            ])
            
        return allowed_origins
    else:
        # In development, allow local development servers
        allowed_origins = [
            "http://localhost:3000",  # React dev server
            "http://127.0.0.1:3000",  # Alternative localhost
            "http://localhost:3001",  # Alternative port
            "http://localhost",       # General localhost
            "http://127.0.0.1",       # Alternative localhost IP
        ]
        
        # Also include custom frontend domain in development for testing
        custom_domain = os.getenv("FRONTEND_DOMAIN")
        if custom_domain:
            allowed_origins.extend([
                f"https://{custom_domain}",
                f"http://{custom_domain}",
            ])
            
        return allowed_origins

origins = get_cors_origins()
logger.info(f"CORS origins configured: {origins}")
logger.info(f"FRONTEND_DOMAIN env var: {os.getenv('FRONTEND_DOMAIN')}")
logger.info(f"ENVIRONMENT env var: {os.getenv('ENVIRONMENT', 'development')}")

# Only add CORS middleware in development or for specific production cases
environment = os.getenv("ENVIRONMENT", "development")
if environment == "development":
    # Full CORS support for development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Minimal CORS for production (NGINX handles most CORS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type", 
            "X-Auth-Token",
            "X-User-Token",
            "X-API-Key",
            "X-Requested-With"
        ],
    )

# Debug logging middleware removed

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Setup Jinja2 templates
templates = Jinja2Templates(directory="app/templates")

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(products.router, tags=["Products"])
app.include_router(ai.router, prefix="/ai", tags=["Generative AI"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(profile.router, tags=["Profile"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])
app.include_router(branding.router, prefix="/branding", tags=["Tenant Branding"])
app.include_router(hero_banners.router, prefix="/hero-banners", tags=["Hero Banners"])
app.include_router(payment.router, tags=["Payment Processing"])
app.include_router(store.router, prefix="/store", tags=["Customer Store"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])

# Root endpoint
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Enhanced root endpoint with comprehensive platform information"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "title": "Multi-Tenant E-Commerce Platform",
        "version": "1.0.0",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "environment": os.getenv("ENVIRONMENT", "development")
    })

# Health check endpoint
@app.get("/health")
async def health_check():
    """Comprehensive health check with system information"""
    try:
        # Basic database connectivity check could be added here
        # For now, return comprehensive system status
        return {
            "status": "healthy",
            "message": "Multi-Tenant E-Commerce Platform is running",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "features": {
                "multi_tenant": True,
                "ai_integration": bool(os.getenv("GEMINI_API_KEY")),
                "database": "postgresql",
                "authentication": "jwt"
            },
            "endpoints": {
                "documentation": "/docs",
                "redoc": "/redoc",
                "health": "/health"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "message": "System experiencing issues",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

