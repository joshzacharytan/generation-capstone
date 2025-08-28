# Staging Environment Setup Guide

## Overview
This staging setup allows you to test a **production-ready frontend behind NGINX** while keeping your **local backend and PostgreSQL** with all your existing test data.

**Architecture:**
```
Browser → NGINX (Container) → Local FastAPI → Local PostgreSQL
```

## Quick Start

## Quick Start

### 1. Start Local Backend (Only!)

```bash
# Activate your virtual environment
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Start FastAPI backend (must be accessible from Docker)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Staging Frontend (Default - points to localhost:8000)

```bash
# Start with default backend (localhost:8000)
docker-compose -f docker-compose.staging.yml up -d
```

### 3. Alternative: Custom Frontend Domain

```bash
# Point to different frontend domain for CORS testing
FRONTEND_DOMAIN=my-test-app.com docker-compose -f docker-compose.staging.yml up -d

# Or create .env.staging file:
echo "FRONTEND_DOMAIN=staging.myapp.com" >> .env.staging
docker-compose -f docker-compose.staging.yml up -d
```

### 4. Access Your Application

- **Main Access:** http://localhost
- **Alternative:** http://localhost:3000
- **Backend Direct:** http://localhost:8000 (for debugging)
- **Health Check:** http://localhost/health (shows backend target)

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_DOMAIN` | (none) | Custom frontend domain for CORS |
| `REACT_APP_API_BASE_URL` | (auto-detected) | Force specific API URL |

### Usage Examples

```bash
# Default (localhost frontend, auto-detects local backend)
docker-compose -f docker-compose.staging.yml up -d

# Test with custom frontend domain
FRONTEND_DOMAIN=test.mydomain.com docker-compose -f docker-compose.staging.yml up -d

# Force direct API calls (bypass proxy)
REACT_APP_API_BASE_URL=http://localhost:8000 docker-compose -f docker-compose.staging.yml up -d

# Force relative paths (test proxy)
REACT_APP_API_BASE_URL=/api docker-compose -f docker-compose.staging.yml up -d

# Using .env file
echo "FRONTEND_DOMAIN=staging.myapp.com" > .env.staging
docker-compose -f docker-compose.staging.yml up -d
```

### Testing Different Domains

**Method 1: Environment Variables**
```bash
# Test with my-test-app.com
FRONTEND_DOMAIN=my-test-app.com docker-compose -f docker-compose.staging.yml up -d
# Access with: curl -H "Host: my-test-app.com" http://localhost/
```

**Method 2: Hosts File**
```bash
# Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 my-test-app.com

# Then start with custom domain
FRONTEND_DOMAIN=my-test-app.com docker-compose -f docker-compose.staging.yml up -d
# Access at: http://my-test-app.com
```

## Testing Checklist

✅ **Frontend loads** - React app should load at http://localhost  
✅ **API calls work** - All API requests should go through `/api/*`  
✅ **No CORS errors** - Browser console should be clean  
✅ **Your test data** - All your existing PostgreSQL data should be accessible  
✅ **Authentication** - Login/register should work with your existing users  
✅ **File uploads** - Product images should work through the proxy  
✅ **Production behavior** - Frontend should behave like production (restricted CORS)  

## Troubleshooting

### Frontend doesn't load
```bash
docker-compose -f docker-compose.staging.yml logs frontend
```

### API calls fail
```bash
# Test if backend is reachable from container
docker exec ecommerce_frontend_staging wget -qO- http://host.docker.internal:8000/health

# Test API proxy
curl http://localhost/api/health
```

### Backend connection issues
- Ensure FastAPI is running on `0.0.0.0:8000` (not just `127.0.0.1`)
- On Linux, you might need to use `172.17.0.1:8000` instead of `host.docker.internal:8000`

### Database connection issues
- Verify your local PostgreSQL is running: `pg_isready -h localhost`
- Check your `.env` file has correct database credentials

## Cleanup

```bash
# Stop staging environment
docker-compose -f docker-compose.staging.yml down

# Remove staging container and images
docker-compose -f docker-compose.staging.yml down --rmi all
```

## Benefits of This Setup

🎯 **Test NGINX proxy** with your real data  
🚀 **Production-like frontend** behavior  
💾 **Keep all test data** in local PostgreSQL  
🔧 **Debug backend easily** (not containerized)  
⚡ **Fast iteration** on backend changes  
🔒 **Validate security** headers and CORS  

This is the perfect setup to validate your NGINX reverse proxy implementation before deploying to your actual production domain! 🚀