# NGINX Reverse Proxy Setup - Implementation Guide

## Overview

This implementation adds NGINX reverse proxy support to route frontend requests to the backend, eliminating CORS issues and providing a single origin for both frontend and backend. The setup works in both development and production environments.

## Key Changes Made

### 1. NGINX Configuration

**Files Created/Updated:**
- `docker/nginx.conf` - Development NGINX configuration
- `docker/nginx.prod.conf` - Production NGINX configuration with security hardening

**Key Features:**
- `/api/*` requests are proxied to FastAPI backend (removing `/api` prefix)
- Static React files served directly by NGINX
- Production config includes rate limiting, security headers, and caching
- Development config includes CORS headers for local development

### 2. FastAPI Backend Updates

**File Modified:** `app/main.py`

**Changes:**
- Environment-specific CORS configuration
- Development: Full CORS support for local React dev server
- Production: Minimal CORS (NGINX handles most routing)
- Supports `ENVIRONMENT` variable to control behavior

### 3. Frontend API Service Updates

**File Modified:** `client/src/services/api.js`

**Changes:**
- Smart URL detection based on hostname
- `gen-capstone.tanfamily.cc` → Uses relative paths `/api/*`
- `localhost` → Direct connection to `http://localhost:8000`
- Removed hardcoded external domains
- Updated auth API to work with both relative and absolute URLs

### 4. Environment Configuration

**Files Created:**
- `.env.prod.example` - Production environment template
- `client/.env.example` - React environment overrides

**Files Updated:**
- `.env.example` - Added `ENVIRONMENT` and `PRODUCTION_DOMAIN` variables

### 5. Docker Compose Updates

**Files Modified:**
- `docker-compose.yml` - Development with NGINX proxy support
- `docker-compose.prod.yml` - Production with proper NGINX mounting

## How It Works

### Development Mode

```
React Dev Server (localhost:3000) → FastAPI (localhost:8000)
```

- React dev server runs on port 3000
- API calls go directly to FastAPI on port 8000
- CORS enabled for cross-origin requests
- Hot reload for both frontend and backend

### Development with Docker

```
Browser → NGINX (localhost:3000) → FastAPI (backend:8000)
```

- NGINX serves React build and proxies API calls
- `/api/*` requests stripped of `/api` and sent to backend
- Single origin eliminates CORS issues

### Production Mode

```
Browser → NGINX (gen-capstone.tanfamily.cc) → FastAPI (backend:8000)
```

- NGINX serves React app and handles all routing
- API calls use relative paths `/api/*`
- No CORS issues (same origin)
- Security headers and rate limiting enabled

## Deployment Instructions

### Development Setup

1. **Standard Development (React Dev Server + FastAPI)**
   ```bash
   # Terminal 1: Start FastAPI backend
   cd /path/to/project
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2: Start React dev server
   cd client
   npm start
   ```

2. **Docker Development (Full Stack)**
   ```bash
   # Set environment
   cp .env.example .env
   # Edit .env as needed
   
   # Start all services
   docker-compose up -d
   
   # Access at http://localhost:3000
   ```

### Production Deployment

1. **Prepare Environment**
   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod with secure values
   ```

2. **Deploy with Docker**
   ```bash
   # Build and start production services
   docker-compose -f docker-compose.prod.yml up -d
   
   # View logs
   docker-compose -f docker-compose.prod.yml logs -f
   ```

3. **Domain Configuration**
   - Point `gen-capstone.tanfamily.cc` to your server
   - Frontend will automatically use relative paths for API calls
   - No additional configuration needed

## Environment Variables

### Backend (.env or .env.prod)

```bash
# Required
DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=your_secure_secret_key
ENVIRONMENT=development|production
GEMINI_API_KEY=your_gemini_key

# Production only
PRODUCTION_DOMAIN=gen-capstone.tanfamily.cc
POSTGRES_PASSWORD=secure_password
REDIS_PASSWORD=secure_password
```

### Frontend (client/.env - Optional)

```bash
# Only needed for custom API endpoints in development
# REACT_APP_API_BASE_URL=http://localhost:8001
```

## Troubleshooting

### Common Issues

1. **API calls fail in production**
   - Ensure domain is correctly configured
   - Check NGINX logs: `docker-compose logs frontend`
   - Verify backend is healthy: `curl http://backend:8000/health`

2. **CORS errors in development**
   - Check `ENVIRONMENT` variable is set to "development"
   - Verify React dev server is running on expected port
   - Check browser dev tools for actual request URLs

3. **Docker networking issues**
   - Ensure all services are on the same network
   - Check service names match in docker-compose files
   - Verify backend is accessible: `docker exec frontend wget -qO- http://backend:8000/health`

### Validation Commands

```bash
# Check backend health
curl http://localhost:8000/health

# Test API through NGINX proxy (Docker)
curl http://localhost:3000/api/health

# Test production setup
curl -H "Host: gen-capstone.tanfamily.cc" http://localhost/api/health
```

## Benefits Achieved

1. **No CORS Issues** - Single origin for frontend and backend
2. **Clean URLs** - All API calls use relative paths in production
3. **Environment Flexibility** - Works in development and production
4. **Security** - Production config includes security headers and rate limiting
5. **Performance** - NGINX efficiently serves static files and proxies API calls
6. **Scalability** - NGINX can handle load balancing and caching

## Next Steps

1. **SSL Configuration** - Add SSL certificates for HTTPS in production
2. **CDN Integration** - Consider adding CloudFlare or similar CDN
3. **Load Balancing** - Scale backend with multiple instances behind NGINX
4. **Monitoring** - Add logging and monitoring for NGINX and API performance

## Files Modified Summary

```
Modified Files:
├── app/main.py (CORS configuration)
├── client/src/services/api.js (URL handling)
├── docker/nginx.conf (Development proxy)
├── docker/nginx.prod.conf (Production proxy)
├── docker/Dockerfile.frontend (NGINX flexibility)
├── docker-compose.yml (Development setup)
├── docker-compose.prod.yml (Production setup)
├── .env.example (Environment variables)

Created Files:
├── .env.prod.example (Production environment)
└── client/.env.example (React overrides)
```