from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app without database initialization
app = FastAPI(
    title="Multi-Tenant E-Commerce Platform - Static File Test",
    description="Testing static file serving without database dependencies.",
    version="0.1.0"
)

# Environment-specific CORS configuration
def get_cors_origins():
    environment = os.getenv("ENVIRONMENT", "development")
    
    if environment == "production":
        allowed_origins = [
            "https://gen-capstone.tanfamily.cc",
            "https://gensg.tanfamily.cc",
        ]
        
        custom_domain = os.getenv("FRONTEND_DOMAIN")
        if custom_domain:
            allowed_origins.extend([
                f"https://{custom_domain}",
                f"http://{custom_domain}",
            ])
            
        return allowed_origins
    else:
        allowed_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://localhost",
            "http://127.0.0.1",
        ]
        
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

# Add CORS middleware
environment = os.getenv("ENVIRONMENT", "development")
if environment == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
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

# Check directory paths for debugging
import os
print(f"Current working directory: {os.getcwd()}")
print(f"app/static exists: {os.path.exists('app/static')}")
print(f"./app/static exists: {os.path.exists('./app/static')}")
if os.path.exists('app/static'):
    print(f"Contents of app/static: {os.listdir('app/static')}")

# Try different path approaches
try:
    # Mount static files BEFORE any routers (this is the fix we're testing)
    # Try absolute path first
    static_dir = os.path.abspath("app/static")
    print(f"Attempting to mount static files from: {static_dir}")
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    print("✅ Static files mounted successfully")
except Exception as e:
    print(f"❌ Failed to mount static files: {e}")
    # Fallback to relative path
    try:
        app.mount("/static", StaticFiles(directory="app/static"), name="static")
        print("✅ Static files mounted with relative path")
    except Exception as e2:
        print(f"❌ Relative path also failed: {e2}")

# Setup Jinja2 templates
templates = Jinja2Templates(directory="app/templates")

# Basic routes for testing
@app.get("/")
async def read_root():
    return {
        "message": "Static file test server running",
        "timestamp": datetime.now().isoformat(),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "frontend_domain": os.getenv("FRONTEND_DOMAIN"),
        "static_test": "Access /static/ to test static file serving"
    }

@app.get("/debug/static")
async def debug_static():
    """Debug endpoint to check static file configuration"""
    import os
    
    return {
        "working_directory": os.getcwd(),
        "app_static_exists": os.path.exists("app/static"),
        "app_static_absolute": os.path.abspath("app/static"),
        "static_contents": os.listdir("app/static") if os.path.exists("app/static") else [],
        "test_file_exists": os.path.exists("app/static/test/test.txt"),
        "static_mount_info": "StaticFiles mounted at /static/ pointing to app/static"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Static file test server is running",
        "timestamp": datetime.now().isoformat(),
        "version": "0.1.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "static_mount": "StaticFiles mounted at /static/"
    }