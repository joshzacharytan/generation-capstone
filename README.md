# Generation Capstone - Multi-Tenant E-Commerce Platform

A full-stack e-commerce platform with React frontend, FastAPI backend, and PostgreSQL database. Supports multiple independent stores with customizable branding and AI-powered features.

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and run
git clone https://github.com/joshzacharytan/generation-capstone.git
cd generation-capstone
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

### Option 2: Local Development

```bash
# Backend setup
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env  # Edit with your database credentials
createdb ecommerce_db
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend setup (new terminal)
cd client
npm install
npm start
```

## 🐳 Docker Configuration Explained

### Why This Project Has Special Docker Files

Unlike typical Docker projects, this application uses **custom NGINX configurations** because:

1. **Frontend Routing**: The React app needs NGINX to proxy `/api/*` requests to the backend
2. **File Serving**: NGINX serves both React static files AND uploaded images from the backend
3. **Environment Flexibility**: Different configs for development, staging, and production
4. **Container Communication**: Handles Docker network routing between frontend and backend

### Key Docker Files:

```
docker/
├── Dockerfile.frontend          # React + NGINX multi-stage build
├── Dockerfile.backend           # FastAPI with Ubuntu VM support  
├── server.prod.conf            # NGINX config for production (container-to-container)
├── server.staging.conf         # NGINX config for development (container-to-host)
├── nginx.prod.conf             # Full NGINX config (legacy)
└── nginx.staging.conf          # Full NGINX config (legacy)
```

### Docker Environments:

```bash
# Development (recommended)
docker-compose up -d

# Staging (containerized frontend + local backend)
docker-compose -f docker-compose.staging.yml up -d

# Production (full containerization)
docker-compose -f docker-compose.prod.yml up -d
```

### Staging Environment (Test Production Setup)

The staging environment lets you test production-ready frontend with your local backend:

```bash
# 1. Start local backend first
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Start containerized frontend (new terminal)
docker-compose -f docker-compose.staging.yml up -d

# Access at: http://localhost
```

**Benefits:**
- ✅ Test NGINX proxy with real data
- ✅ Production-like frontend behavior  
- ✅ Keep existing test data in local PostgreSQL
- ✅ Debug backend easily (not containerized)

## ⚙️ Environment Variables

Create `.env` file:
```env
DATABASE_URL=postgresql://postgres:password@localhost/ecommerce_db
SECRET_KEY=your-jwt-secret-key-here
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_DOMAIN=localhost  # Change for production/VM
```

**Important:** Set `FRONTEND_DOMAIN` correctly:
- Local: `localhost`
- Ubuntu VM: `your-vm-ip-address` 
- Production: `your-domain.com`

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend Container"
        React[React App]
        Nginx[NGINX Proxy]
    end
    
    subgraph "Backend Container"
        FastAPI[FastAPI]
    end
    
    subgraph "Database"
        DB[(PostgreSQL)]
    end
    
    React --> Nginx
    Nginx -->|/api/*| FastAPI
    FastAPI --> DB
    
    style React fill:#61dafb
    style FastAPI fill:#009688
    style DB fill:#336791
```

## 🎯 Key Features

- **Multi-Tenant Stores**: Independent stores with data isolation
- **Product Management**: Full CRUD with image uploads
- **Shopping Cart & Checkout**: Guest checkout supported
- **AI Descriptions**: Auto-generate with Google Gemini
- **Sales Analytics**: Revenue tracking and insights
- **Theme System**: Light/Dark/System modes
- **Admin Dashboard**: Complete store management
- **Customer Storefront**: Public shopping interface

## 📊 Analytics Dashboard

```mermaid
graph TB
    subgraph "Admin Dashboard"
        Revenue[Revenue Tracking]
        Orders[Order Analytics]
        Products[Top Products]
        Growth[Growth Metrics]
    end
    
    subgraph "Customer Storefront"
        Store[Public Store]
        Cart[Shopping Cart]
        Checkout[Guest Checkout]
    end
    
    Revenue --> Database
    Orders --> Database
    Products --> Database
    Store --> FastAPI
    Cart --> FastAPI
    
    style Revenue fill:#4CAF50
    style Orders fill:#2196F3
    style Products fill:#FF9800
    style Store fill:#9C27B0
```

## 🛠️ Technology Stack

- **Backend**: FastAPI, PostgreSQL, JWT Authentication
- **Frontend**: React 18, Context API, CSS Variables
- **AI**: Google Gemini for product descriptions
- **DevOps**: Docker, NGINX, GitHub Container Registry

## 🚀 Deployment Options

### Pre-built Images (GitHub Container Registry)

```bash
# Pull and run backend
docker run -d -p 8000:8000 \
  -e DATABASE_URL="postgresql://postgres:password@host.docker.internal:5432/ecommerce_db" \
  -e SECRET_KEY="your-secret-key" \
  -e FRONTEND_DOMAIN="localhost" \
  ghcr.io/joshzacharytan/generation-capstone-backend:latest

# Pull and run frontend  
docker run -d -p 3000:80 \
  ghcr.io/joshzacharytan/generation-capstone-frontend:latest
```

### Build Your Own Images

```bash
# Build frontend (with NGINX config)
docker build -f docker/Dockerfile.frontend -t my-frontend --build-arg NGINX_CONFIG=prod .

# Build backend
docker build -f docker/Dockerfile.backend -t my-backend .
```

### Ubuntu VM Deployment

```bash
# Set correct domain for VM
export FRONTEND_DOMAIN="your-vm-ip-address"

# Use staging config (connects to host)
docker-compose -f docker-compose.staging.yml up -d
```

## 💡 Getting Started

1. **Run with Docker**: `docker-compose up -d`
2. **Register**: Go to http://localhost:3000 and create your store
3. **Add Products**: Use the admin dashboard to add products
4. **Visit Store**: Your public store is at http://localhost:3000/store/your-domain
5. **Test Shopping**: Add items to cart and complete checkout

## 📚 API Documentation

- **Admin Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Store Frontend**: http://localhost:3000/store/{domain}
- **Health Check**: http://localhost:8000/health

## 🔧 Troubleshooting

### Common Docker Issues

**Frontend doesn't load:**
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild if needed
docker-compose build --no-cache
```

**API calls fail:**
```bash
# Test backend health
curl http://localhost:8000/health

# Test through NGINX proxy
curl http://localhost:3000/api/health
```

**Staging environment issues:**
```bash
# Ensure backend runs on 0.0.0.0 (not 127.0.0.1)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Test container can reach backend
docker exec generation_capstone-frontend-1 wget -qO- http://host.docker.internal:8000/health
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes and test
4. Commit: `git commit -m 'feat: description'`
5. Push and create Pull Request

---

**Built for DevOps Bootcamp Capstone** 🚀

*This project demonstrates multi-tenant architecture, Docker containerization, and full-stack web development.*