# 🛒 Generation Capstone - Multi-Tenant E-Commerce Platform

A modern, full-stack e-commerce platform that enables multiple independent businesses to run their own online stores with AI-powered features and customizable branding.

## ✨ Features

- 🏪 **Multi-tenant stores** - Each business gets their own isolated store
- 📦 **Product management** - Full CRUD operations with image uploads
- 🛍️ **Guest checkout** - No registration required for customers
- 🤖 **AI descriptions** - Auto-generate product descriptions with Google Gemini
- 📊 **Admin dashboard** - Complete store management interface
- 📈 **Sales analytics** - Interactive dashboard with revenue trends
- 📋 **Order processing** - Track and manage customer orders
- 👑 **SuperAdmin portal** - Monitor all tenants and system health
- 🎨 **Theme system** - Light/dark mode support
- 📱 **Mobile responsive** - Optimized for all devices

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "User Layer"
        Customer[👤 Customer]
        Admin[👨‍💼 Store Admin]
        SuperAdmin[👑 Super Admin]
    end
    
    subgraph "Frontend Container (Port 80)"
        React[⚛️ React App<br/>Multi-tenant UI]
        Nginx[🌐 NGINX<br/>Reverse Proxy]
    end
    
    subgraph "Backend Container (Port 8000)"
        FastAPI[🚀 FastAPI<br/>REST API]
        Auth[🔐 JWT Auth]
        AI[🤖 Gemini AI]
    end
    
    subgraph "Database Layer"
        DB[(🐘 PostgreSQL<br/>Multi-tenant Data)]
    end
    
    subgraph "External Services"
        DockerHub[🐳 Docker Hub<br/>Image Registry]
        Gemini[🧠 Google Gemini<br/>AI Service]
    end
    
    Customer --> React
    Admin --> React
    SuperAdmin --> React
    
    React --> Nginx
    Nginx -->|/api/*| FastAPI
    Nginx -->|/static/*| React
    
    FastAPI --> Auth
    FastAPI --> AI
    FastAPI --> DB
    
    AI --> Gemini
    
    style React fill:#61dafb,color:#000
    style FastAPI fill:#009688,color:#fff
    style DB fill:#336791,color:#fff
    style Nginx fill:#269539,color:#fff
    style AI fill:#4285f4,color:#fff
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Context API, CSS Variables | Multi-tenant UI with theme system |
| **Proxy** | NGINX | Static file serving & API routing |
| **Backend** | FastAPI, SQLAlchemy, JWT | REST API with authentication |
| **Database** | PostgreSQL | Multi-tenant data isolation |
| **AI** | Google Gemini | Product description generation |
| **DevOps** | Docker, Docker Hub | Containerized deployment |

## 🚀 Quick Installation

### Prerequisites
- Ubuntu VM with PostgreSQL installed
- Docker and Docker Compose
- Internet connection for Docker Hub images

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/joshzacharytan/generation-capstone.git
cd generation-capstone

# 2. Create environment file
cp .env.example .env

# 3. Create required directories with proper permissions
mkdir -p ./uploads/{products,logos,banners} ./logs
sudo chown -R 1000:1000 ./uploads ./logs
sudo chmod -R 755 ./uploads ./logs

# 4. Find your VM IP address
ip addr show | grep "inet " | grep -v 127.0.0.1
# Note the IP (e.g., 192.168.1.100)

# 5. Configure PostgreSQL for Docker access
sudo nano /etc/postgresql/*/main/postgresql.conf
# Change: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add these lines at the end:
# host    all    all    172.16.0.0/12    md5
# host    all    all    192.168.0.0/16   md5

sudo systemctl restart postgresql

# 6. Create database
psql -h localhost -U postgres
# In PostgreSQL prompt:
CREATE DATABASE ecommerce_db;
\\q

# 7. Configure environment variables
nano .env
# Update with your details:
# DATABASE_URL=postgresql://postgres:your_password@192.168.1.100:5432/ecommerce_db
# FRONTEND_DOMAIN=192.168.1.100
# SECRET_KEY=your-super-secret-key-here-make-it-long
# GEMINI_API_KEY=your-google-gemini-api-key

# 8. Start the application
docker compose up -d

# 9. Verify deployment
docker compose ps
docker compose logs -f

# 10. Access your application
# Open browser: http://192.168.1.100
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Main Application** | `http://your-vm-ip/` | Login portal for admins |
| **Customer Storefront** | `http://your-vm-ip/store/{tenant-domain}` | Public shopping interface |
| **API Documentation** | `http://your-vm-ip:8000/docs` | Interactive Swagger UI |
| **Health Check** | `http://your-vm-ip:8000/health` | Backend status |

## 🎯 Getting Started Guide

1. **Register Your First Store**
   - Visit `http://your-vm-ip/`
   - Click "Register New Store"
   - Fill in your business details

2. **Set Up Your Products**
   - Login to admin dashboard
   - Navigate to "Products" section
   - Add products with images and descriptions
   - Use AI to generate descriptions automatically

3. **Customize Your Store**
   - Upload your logo and banner
   - Set your store domain name
   - Configure theme preferences

4. **Test Customer Experience**
   - Visit `http://your-vm-ip/store/your-domain`
   - Add products to cart
   - Complete checkout process

## 🔧 Troubleshooting Guide

### 🚨 Common Issues & Solutions

#### Database Connection Failed
**Error:** `connection to server failed: connection refused`

**Solution:**
```bash
# 1. Check PostgreSQL is running
sudo systemctl status postgresql

# 2. Configure PostgreSQL for Docker access
sudo nano /etc/postgresql/*/main/postgresql.conf
# Ensure: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: host all all 172.16.0.0/12 md5

# 3. Restart PostgreSQL
sudo systemctl restart postgresql

# 4. Test connection
psql -h your-vm-ip -U postgres -d ecommerce_db
```

#### Upload Directory Permissions
**Error:** `Permission denied: 'app/static/uploads'`

**Solution:**
```bash
# Fix directory ownership for Docker containers
sudo chown -R 1000:1000 ./uploads ./logs
sudo chmod -R 755 ./uploads ./logs

# Restart containers
docker compose restart
```

#### Broken Product Images
**Issue:** Uploaded images show as broken icons

**Solution:**
```bash
# 1. Check nginx configuration is correct
docker compose logs frontend

# 2. Verify image files exist
ls -la ./uploads/products/

# 3. Ensure using correct image tags
# Should be: joshzacharytan/generation-capstone-*:before-theme
```

#### Database Schema Issues
**Error:** `column users.role does not exist`

**Solution:**
```bash
# Recreate database with fresh schema
psql -h your-vm-ip -U postgres
DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE ecommerce_db;
\\q

# Restart backend to recreate tables
docker compose restart backend
```

#### Container Won't Start
**Issue:** Containers exit immediately or won't start

**Solution:**
```bash
# 1. Check container logs
docker compose logs backend
docker compose logs frontend

# 2. Verify environment variables
cat .env

# 3. Check Docker images
docker images | grep generation-capstone

# 4. Pull latest images
docker compose pull

# 5. Restart everything
docker compose down
docker compose up -d
```

### 🔍 Debugging Commands

```bash
# Check container status
docker compose ps

# View real-time logs
docker compose logs -f

# Check specific service logs
docker compose logs backend
docker compose logs frontend

# Test database connection
psql -h your-vm-ip -U postgres -d ecommerce_db

# Test API endpoints
curl http://your-vm-ip:8000/health
curl http://your-vm-ip:8000/docs

# Check static file serving
curl http://your-vm-ip/static/test.txt

# Restart specific service
docker compose restart backend

# Complete restart
docker compose down && docker compose up -d
```

### 📞 Still Having Issues?

1. **Check the logs first**: `docker compose logs -f`
2. **Verify your .env file**: Ensure all variables are set correctly
3. **Test database connectivity**: Use `psql` to connect directly
4. **Check firewall settings**: Ensure ports 80 and 8000 are open
5. **Verify Docker Hub images**: Ensure you're using the correct image tags

## 📚 Development History

This project evolved through several key phases:

1. **Initial Development** - Basic multi-tenant e-commerce functionality
2. **Mobile Responsiveness** - Added comprehensive mobile-first design
3. **Docker Containerization** - Implemented production-ready Docker setup
4. **Theme System** - Added light/dark mode support
5. **Deployment Pipeline** - Established Local → Docker Hub → Ubuntu VM → Azure workflow

## 🏆 Project Achievements

- ✅ Multi-tenant architecture with data isolation
- ✅ AI-powered product descriptions
- ✅ Mobile-responsive design
- ✅ Production-ready Docker containers
- ✅ Comprehensive admin dashboard
- ✅ Guest checkout functionality
- ✅ Theme system with dark/light modes
- ✅ Scalable deployment pipeline

---

**🎓 Built for DevOps Bootcamp Capstone**

*Demonstrates modern full-stack development, containerization, and cloud deployment practices.*