# Generation Capstone - Multi-Tenant E-Commerce Platform

A full-stack e-commerce platform with React frontend, FastAPI backend, and PostgreSQL database. Supports multiple independent stores with customizable branding and AI-powered features.

## 🚀 Quick Start

### 🎯 Production Testing (Ubuntu VM + PostgreSQL)

**For testing with pre-built containers and existing PostgreSQL on Ubuntu VM:**

```bash
# 1. Setup environment
git clone https://github.com/joshzacharytan/generation-capstone.git
cd generation-capstone
cp .env.example .env

# 2. Create required directories with proper permissions
mkdir -p ./uploads/{products,logos,banners} ./logs
sudo chown -R 1000:1000 ./uploads ./logs
sudo chmod -R 755 ./uploads ./logs

# 3. Find your VM IP address
ip addr show | grep "inet " | grep -v 127.0.0.1
# Note the IP (e.g., 192.168.1.7)

# 4. Edit .env with your VM details
nano .env
# Update these lines:
# DATABASE_URL=postgresql://postgres:your_password@192.168.1.7:5432/ecommerce_db
# FRONTEND_DOMAIN=192.168.1.7
# SECRET_KEY=your-secret-key-here

# 5. Configure PostgreSQL for Docker access
sudo nano /etc/postgresql/*/main/postgresql.conf
# Ensure: listen_addresses = '*'
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add lines:
# host    all             all             172.16.0.0/12           md5
# host    all             all             192.168.0.0/16          md5
sudo systemctl restart postgresql

# 6. Create/recreate database
psql -h localhost -U postgres
# In PostgreSQL prompt:
# DROP DATABASE IF EXISTS ecommerce_db;
# CREATE DATABASE ecommerce_db;
# \q

# 7. Test database connection
psql -h 192.168.1.7 -U postgres -d ecommerce_db
# If connection works, proceed to next step

# 8. Run containers (uses Docker Hub pre-built images)
docker-compose up -d

# 9. Check logs and verify startup
docker-compose logs backend
docker-compose ps

# 10. Access your store
# Open browser: http://192.168.1.7
```

**What this does:**
- ✅ Uses pre-built images from Docker Hub
- ✅ Connects to your existing PostgreSQL on Ubuntu VM  
- ✅ Frontend accessible on port 80 (production-like)
- ✅ Backend API proxied through NGINX
- ✅ Persistent file uploads and logs

### 🔧 Local Development

**For development with hot reload:**

```bash
# Clone and run with local database
git clone https://github.com/joshzacharytan/generation-capstone.git
cd generation-capstone
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:3000  
- Backend API: http://localhost:8000/docs

### 💻 Manual Setup (Advanced)

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

### 🔍 Production Testing Troubleshooting

**Can't connect to database?**
```bash
# Check PostgreSQL is running on your VM
sudo systemctl status postgresql

# Test connection from your machine
psql -h localhost -U postgres -d ecommerce_db

# Check PostgreSQL config allows Docker connections
sudo nano /etc/postgresql/*/main/postgresql.conf  # listen_addresses = '*'
sudo nano /etc/postgresql/*/main/pg_hba.conf       # Add: host all all 172.0.0.0/8 md5
sudo systemctl restart postgresql

# Test Docker to PostgreSQL connection
docker run --rm postgres:13 psql "postgresql://postgres:your_password@192.168.1.7:5432/ecommerce_db" -c "SELECT 1;"
```

**Permission denied errors for uploads?**
```bash
# Create upload directories with proper permissions
mkdir -p ./uploads/{products,logos,banners} ./logs
sudo chown -R 1000:1000 ./uploads ./logs
sudo chmod -R 755 ./uploads ./logs
```

**Database schema issues (column users.role does not exist)?**
```bash
# Recreate database to fix schema issues
psql -h localhost -U postgres
# In PostgreSQL prompt:
DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE ecommerce_db;
\q

# Restart backend to recreate schema
docker-compose restart backend

# Verify tables were created
psql -h localhost -U postgres -d ecommerce_db -c "\dt"
psql -h localhost -U postgres -d ecommerce_db -c "\d users"
```

**Frontend not loading?**
```bash
# Check containers are running
docker-compose ps

# Check logs
docker-compose logs frontend
docker-compose logs backend

# Verify your .env settings
cat .env
```

**Stop everything:**
```bash
docker-compose down
```

### 🛠️ Common Issues and Solutions

#### Issue 1: PostgreSQL Connection Refused
**Error:** `connection to server at "192.168.1.7", port 5432 failed: connection refused`

**Solution:**
```bash
# 1. Configure PostgreSQL to accept external connections
sudo nano /etc/postgresql/*/main/postgresql.conf
# Change: #listen_addresses = 'localhost' to: listen_addresses = '*'

# 2. Configure authentication for Docker networks
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add these lines:
host    all             all             172.16.0.0/12           md5
host    all             all             192.168.0.0/16          md5

# 3. Restart PostgreSQL
sudo systemctl restart postgresql

# 4. Update your .env file with VM IP
DATABASE_URL=postgresql://postgres:your_password@192.168.1.7:5432/ecommerce_db
```

#### Issue 2: Docker Upload Directory Permissions
**Error:** `PermissionError: [Errno 13] Permission denied: 'app/static/uploads/products'`

**Solution:**
```bash
# Create directories with proper ownership before starting containers
mkdir -p ./uploads/{products,logos,banners} ./logs
sudo chown -R 1000:1000 ./uploads ./logs
sudo chmod -R 755 ./uploads ./logs
```

#### Issue 3: Database Schema Missing
**Error:** `column users.role does not exist` or `duplicate key value violates unique constraint`

**Solution:**
```bash
# Option A: Clean database recreation (recommended)
psql -h localhost -U postgres
DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE ecommerce_db;
\q

# Option B: Manual cleanup if needed
psql -h localhost -U postgres -d ecommerce_db
DROP TYPE IF EXISTS role CASCADE;
DROP TYPE IF EXISTS orderstatus CASCADE;
\q

# Restart backend to recreate schema
docker-compose restart backend
```

#### Issue 4: host.docker.internal Not Working on Ubuntu
**Error:** `could not translate host name "host.docker.internal" to address`

**Solution:**
```bash
# Use actual VM IP address instead of host.docker.internal
# Find your VM IP:
ip addr show | grep "inet " | grep -v 127.0.0.1

# Update .env file:
DATABASE_URL=postgresql://postgres:your_password@192.168.1.7:5432/ecommerce_db
```

#### Issue 5: Registration Fails with 500 Error
**Error:** Backend shows database schema errors during user registration

**Solution:**
```bash
# Verify database schema is complete
psql -h localhost -U postgres -d ecommerce_db -c "\dt"
psql -h localhost -U postgres -d ecommerce_db -c "\d users"

# If tables missing, recreate database and restart backend
docker-compose down
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS ecommerce_db; CREATE DATABASE ecommerce_db;"
docker-compose up -d
```

## 🐳 Docker Configuration Explained

### Why This Project Uses Custom Docker Setup

This application uses **custom NGINX configurations** because:

1. **Frontend Routing**: The React app needs NGINX to proxy `/api/*` requests to the backend
2. **File Serving**: NGINX serves both React static files AND uploaded images from the backend
3. **Production Ready**: Uses pre-built images from Docker Hub
4. **Container Communication**: Handles Docker network routing between frontend and backend

### Key Docker Files:

```
docker/
├── Dockerfile.frontend          # React + NGINX multi-stage build
├── Dockerfile.backend           # FastAPI with Ubuntu VM support  
├── server.prod.conf            # NGINX config for production
├── nginx.prod.conf             # Full NGINX config
└── nginx.conf                  # Development NGINX config
```

### Single Docker Compose Deployment:

```bash
# Production testing (recommended)
docker-compose up -d
```

## ⚙️ Environment Variables

Create `.env` file from the example:
```bash
cp .env.example .env
```

Edit with your details:
```env
DATABASE_URL=postgresql://postgres:your_password@your_vm_ip:5432/ecommerce_db
FRONTEND_DOMAIN=your-domain.com
SECRET_KEY=your-jwt-secret-key-here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Important:** Set `FRONTEND_DOMAIN` and `DATABASE_URL` correctly for your setup.

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
- **DevOps**: Docker, NGINX, Docker Hub

## 🚀 Deployment

### Using Pre-built Images (Recommended)

```bash
# Simple one-command deployment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Build Your Own Images

```bash
# Build frontend (with NGINX config)
docker build -f docker/Dockerfile.frontend -t my-frontend --build-arg NGINX_CONFIG=prod .

# Build backend
docker build -f docker/Dockerfile.backend -t my-backend .
```

## 💡 Getting Started

### 🎯 For Production Testing (Ubuntu VM):
1. **Deploy**: Follow "🎯 Production Testing" section above
2. **Access**: Go to http://your-domain.com and register your store
3. **Add Products**: Use the admin dashboard to add products with images
4. **Visit Store**: Your public store is at http://your-domain.com/store/your-domain
5. **Test Shopping**: Add items to cart and complete guest checkout

### 🛠️ For Local Development:
1. **Run**: `docker-compose up -d`
2. **Access**: Go to http://localhost:3000 and register your store
3. **Add Products**: Use the admin dashboard to add products with images
4. **Visit Store**: Your public store is at http://localhost:3000/store/your-domain
5. **Test Shopping**: Add items to cart and complete guest checkout

## 📚 API Documentation

**Local Development:**
- **Admin Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Store Frontend**: http://localhost:3000/store/{domain}
- **Health Check**: http://localhost:8000/health

**Production Testing:**
- **Admin Dashboard**: http://your-domain.com
- **API Docs**: http://your-domain.com/api/docs
- **Store Frontend**: http://your-domain.com/store/{domain}
- **Health Check**: http://your-domain.com/health

**Note:** Replace `your-domain.com` with your configured domain (set via `FRONTEND_DOMAIN` environment variable)

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
# Test backend health directly
docker-compose exec backend python -c "import requests; print(requests.get('http://localhost:8000/health').text)"

# Test through NGINX proxy
curl http://your-domain.com/api/health
```

**Database connection issues:**
```bash
# Check your .env file
cat .env

# Test database connection from your machine
psql -h your_vm_ip -U postgres -d ecommerce_db
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