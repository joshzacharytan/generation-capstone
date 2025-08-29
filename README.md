# Generation Capstone - Multi-Tenant E-Commerce Platform

A full-stack e-commerce platform that enables multiple independent stores with customizable branding and AI-powered features. Built with React, FastAPI, and PostgreSQL.

- **Multi-tenant stores** - Each business gets their own isolated store
- **Product management** - Full CRUD with image uploads
- **Guest checkout** - No registration required for customers
- **AI descriptions** - Auto-generate product descriptions with Google Gemini
- **Admin dashboard** - Complete store management interface
- **Theme system** - Light/dark mode support
>>>>>>> feature/theme-system
## 🚀 What This Project Does

- **Multi-tenant stores** - Each business gets their own isolated store
- **Product management** - Full CRUD with image uploads
- **Guest checkout** - No registration required for customers
- **AI descriptions** - Auto-generate product descriptions with Google Gemini
- **Admin dashboard** - Complete store management interface
- **Theme system** - Light/dark mode support
- **Sales Analytics** - Interactive dashboard with revenue trends and business insights
- **Order Processing** - Track and manage customer orders
- **SuperAdmin Portal** - Monitor all tenants and system health

### Access Points
- **Admin Dashboard**: `http://localhost:3000/` (Login with tenant admin credentials)
- **SuperAdmin Portal**: `http://localhost:3000/` (Login with super admin credentials)
- **Customer Storefront**: `http://localhost:3000/store/{tenant_domain}` (Public access)
- **API Documentation**: `http://localhost:8000/docs` (Interactive Swagger UI)
=======
- **Multi-tenant stores** - Each business gets their own isolated store
- **Product management** - Full CRUD with image uploads
- **Guest checkout** - No registration required for customers
- **AI descriptions** - Auto-generate product descriptions with Google Gemini
- **Admin dashboard** - Complete store management interface
- **Theme system** - Light/dark mode support
>>>>>>> feature/theme-system

## 🐳 Quick Installation (Docker)

### Prerequisites
- Ubuntu VM with PostgreSQL installed
- Docker and Docker Compose
>>>>>>> feature/theme-system
### Prerequisites
- Ubuntu VM with PostgreSQL installed
- Docker and Docker Compose
=======
### Prerequisites
- Ubuntu VM with PostgreSQL installed
- Docker and Docker Compose
>>>>>>> feature/theme-system

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
    Nginx --> FastAPI
    FastAPI --> DB
    
    style React fill:#61dafb
    style FastAPI fill:#009688
    style DB fill:#336791
```

## 📊 Sales Analytics Dashboard

The platform includes a comprehensive sales analytics dashboard that provides real-time business insights and performance tracking for tenant administrators.

### 💼 Key Features

**Business Intelligence**
- 💰 **Revenue Tracking**: Real-time revenue monitoring with growth percentages
- 📋 **Order Analytics**: Track order volumes, counts, and average order values
- 📈 **Trend Analysis**: Interactive line charts showing revenue and order trends
- 📅 **Multi-Period Reports**: 7, 30, 90, and 365-day analysis windows

**Interactive Visualizations**
- 📊 **Line Charts**: Dual-axis charts showing revenue vs order count trends
- 🏆 **Top Products Table**: Sortable rankings by revenue, quantity, orders, and pricing
- 🎨 **Visual Indicators**: Sort icons and growth trend arrows
- 🗂️ **Category Filtering**: Filter analytics by product categories

**Data Insights**
- 📈 **Growth Metrics**: Period-over-period revenue growth comparisons
- 📊 **Status Distribution**: Order status breakdown with values
- 🔄 **Real-time Updates**: Live data refresh based on current orders
- 🎯 **Performance Rankings**: Identify top-performing products and categories

### 🚀 Technical Implementation

**Backend Analytics API**
```
# Three core analytics endpoints
GET /orders/analytics/overview      # KPIs and growth metrics
GET /orders/analytics/revenue-trend # Daily revenue and order trends  \nGET /orders/analytics/top-products  # Best-selling products analysis
```

**Frontend Features**
- **Interactive Sorting**: Click column headers to sort by different metrics
- **Category Filtering**: Dropdown to filter by product categories
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Error Handling**: Comprehensive loading states and error messages

**Database Optimization**
- **Efficient Queries**: Optimized SQL with proper indexing
- **Multi-Tenant Filtering**: Automatic tenant isolation for all analytics
- **Legacy Support**: Handles both new category IDs and legacy category names

### 💹 Business Value

- **Revenue Optimization**: Identify best-selling products and high-value categories
- **Inventory Management**: Track product performance to optimize stock levels
- **Growth Tracking**: Monitor business growth with period comparisons
- **Decision Support**: Data-driven insights for business strategy

## 🆕 Recent Updates

### 🔧 Critical Fixes & Stability Improvements (v1.1.0)
- **SuperAdmin Portal**: Fixed API routing issue preventing tenant information fetching
  - Resolved missing `/admin` prefix in FastAPI router configuration
  - Enhanced admin authentication and tenant data access
  - Improved modal UX with proper scroll isolation and body scroll prevention
- **Search Enhancement**: Enhanced search suggestions with product images and direct routing
  - Added 40x40px product images in search dropdown instead of emoji icons
  - Implemented direct routing to product detail pages for better UX
  - Optimized search suggestion performance and rendering
- **Platform Information**: Enhanced FastAPI root endpoint with comprehensive system information
  - Added feature showcase and technology stack display
  - Improved API documentation and quick access links
  - Enhanced developer experience with detailed system overview

### 🧹 Code Quality & Maintenance
- **Payment System Cleanup**: Removed legacy payment test components
  - Maintained storefront checkout functionality while cleaning admin interface
  - Removed unused API endpoints and dependencies
  - Streamlined codebase for better maintainability
- **AI Service Reliability**: Improved timeout handling and error management
  - Enhanced robustness with comprehensive timeout scenarios
  - Better error categorization and user feedback
  - Fallback mechanisms for external service failures
- **Authentication Fixes**: Resolved customer authentication and routing issues
  - Fixed FastAPI routing compatibility with Cloudflare tunnel
  - Cleaned up debug components and improved error handling
  - Enhanced security and session management

### 📊 Analytics & Business Intelligence
- **Comprehensive Dashboard**: Added interactive sales analytics with real-time insights
  - Revenue tracking with growth percentages and trend analysis
  - Top products analysis with sortable metrics
  - Multi-period reporting (7, 30, 90, 365 days)
  - Category filtering and performance rankings
- **Technical Implementation**: Optimized backend analytics API with efficient queries
  - Three core analytics endpoints for overview, trends, and product analysis
  - Database optimization with proper indexing and multi-tenant filtering
  - Legacy support for both new category IDs and legacy category names

## 📋 Prerequisites

- **Python 3.8+** (Recommended: 3.11+)
- **Node.js 16+** (Recommended: 18+)
- **PostgreSQL 12+** (Recommended: 15+)
- **Google Gemini API Key** (for AI features)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
# From GitHub (Public)
git clone https://github.com/joshzacharytan/generation-capstone.git
cd generation-capstone

# Or from Gitea (Private)
git clone http://100.66.17.68:3000/joshzacharytan/generation_capstone.git
cd generation_capstone
```

### 2. Backend Setup

#### Create Python Virtual Environment
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

#### Install Backend Dependencies
```bash
pip install -r requirements.txt
```

#### Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file:
```env
DATABASE_URL=postgresql://postgres:password@localhost/ecommerce_db
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_jwt_secret_key_here
```

#### Setup Database
```bash
# Create database
createdb ecommerce_db

# Run the application (creates tables automatically)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd client
npm install
```

#### Start Development Server
```bash
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🐳 Docker & Production Deployment

### Development with Docker

```bash
# Start all services (backend, frontend, database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services available at:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Database: localhost:5432

### Production Deployment

#### 1. Create Production Environment
```bash
# Copy production template
cp .env.prod.example .env.prod

# Edit with your production values
nano .env.prod
```

#### 2. Deploy with Docker Compose
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### 3. Production Environment Variables

Required variables in `.env.prod`:
```env
POSTGRES_DB=ecommerce_db_prod
POSTGRES_USER=ecommerce_user
POSTGRES_PASSWORD=secure-password-here
SECRET_KEY=generate-with-openssl-rand-hex-32
```

### Docker Architecture

```mermaid
graph TB
    subgraph "Docker Containers"
        subgraph "Frontend Container"
            React[React App]
            Nginx[Nginx Server]
        end
        
        subgraph "Backend Container"
            FastAPI[FastAPI App]
            Uvicorn[Uvicorn Server]
        end
        
        subgraph "Database Container"
            Postgres[(PostgreSQL)]
        end
    end
    
    React --> FastAPI
    FastAPI --> Postgres
=======
    React --> Nginx
    Nginx -->|/api/*| FastAPI
    FastAPI --> DB
>>>>>>> feature/theme-system
    
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