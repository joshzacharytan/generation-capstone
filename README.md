# Generation Capstone - Multi-Tenant E-Commerce Platform

A full-stack e-commerce platform that enables multiple independent stores with customizable branding and AI-powered features. Built with React, FastAPI, and PostgreSQL.

## 🚀 What This Project Does

- **Multi-tenant stores** - Each business gets their own isolated store
- **Product management** - Full CRUD with image uploads
- **Guest checkout** - No registration required for customers
- **AI descriptions** - Auto-generate product descriptions with Google Gemini
- **Admin dashboard** - Complete store management interface
- **Theme system** - Light/dark mode support

## 🐳 Quick Installation (Docker)

### Prerequisites
- Ubuntu VM with PostgreSQL installed
- Docker and Docker Compose

### Setup Steps

```bash
# 1. Clone and setup
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

# 4. Configure PostgreSQL for Docker access
sudo nano /etc/postgresql/*/main/postgresql.conf
# Change: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add these lines:
# host    all    all    172.16.0.0/12    md5
# host    all    all    192.168.0.0/16   md5

sudo systemctl restart postgresql

# 5. Create database
psql -h localhost -U postgres
# In PostgreSQL prompt:
# CREATE DATABASE ecommerce_db;
# \q

# 6. Edit .env file
nano .env
# Update with your details:
# DATABASE_URL=postgresql://postgres:your_password@192.168.1.7:5432/ecommerce_db
# FRONTEND_DOMAIN=192.168.1.7
# SECRET_KEY=your-secret-key-here

# 7. Start containers
docker-compose up -d

# 8. Access your application
# Open browser: http://192.168.1.7
```

## 🔧 Common Issues & Solutions

### Issue 1: Database Connection Refused
**Error:** `connection to server at "192.168.1.7", port 5432 failed: connection refused`

**Solution:**
```bash
# Configure PostgreSQL to accept external connections
sudo nano /etc/postgresql/*/main/postgresql.conf
# Change: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: host all all 192.168.0.0/16 md5

sudo systemctl restart postgresql
```

### Issue 2: Permission Denied for Upload Directories
**Error:** `PermissionError: [Errno 13] Permission denied: 'app/static/uploads/products'`

**Solution:**
```bash
# Create directories with proper ownership before starting containers
mkdir -p ./uploads/{products,logos,banners} ./logs
sudo chown -R 1000:1000 ./uploads ./logs
sudo chmod -R 755 ./uploads ./logs
```

### Issue 3: Database Schema Missing
**Error:** `column users.role does not exist`

**Solution:**
```bash
# Recreate database to fix schema
psql -h localhost -U postgres
# DROP DATABASE IF EXISTS ecommerce_db;
# CREATE DATABASE ecommerce_db;
# \q

# Restart backend to recreate schema
docker-compose restart backend
```

### Issue 4: host.docker.internal Not Working
**Error:** `could not translate host name "host.docker.internal"`

**Solution:**
```bash
# Use actual VM IP instead of host.docker.internal
# Update .env file:
DATABASE_URL=postgresql://postgres:your_password@192.168.1.7:5432/ecommerce_db
```

## 🏗️ Architecture

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

- **Frontend**: React 18 with NGINX reverse proxy
- **Backend**: FastAPI with Python 3.11
- **Database**: PostgreSQL with multi-tenant data isolation
- **Deployment**: Docker containers with pre-built images

## 📊 Tech Stack

- **Frontend:** React 18, Context API, CSS Variables
- **Backend:** FastAPI, SQLAlchemy, JWT Authentication
- **Database:** PostgreSQL
- **AI:** Google Gemini for product descriptions
- **DevOps:** Docker, NGINX, Docker Hub

## 🚀 Getting Started

1. Follow the **Quick Installation** steps above
2. Register your first store at `http://your-vm-ip`
3. Access admin dashboard to add products
4. Visit your public store at `http://your-vm-ip/store/your-domain`
5. Test the shopping cart and checkout process

## 🔍 Troubleshooting

**Check container status:**
```bash
docker-compose ps
docker-compose logs backend
```

**Test database connection:**
```bash
psql -h 192.168.1.7 -U postgres -d ecommerce_db
```

**Restart everything:**
```bash
docker-compose down
docker-compose up -d
```

---

**Built for DevOps Bootcamp Capstone** 🎓

*Demonstrates multi-tenant architecture, Docker containerization, and full-stack development.*