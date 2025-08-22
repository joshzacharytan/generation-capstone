# Generation Capstone - Multi-Tenant E-Commerce Platform

A full-stack, multi-tenant e-commerce platform built for DevOps bootcamp capstone demonstration. This whitelabel solution enables multiple independent stores on a single platform instance with comprehensive product management, order processing, and AI-powered features.

## 🚀 Live Demo

- **Admin Dashboard**: `http://localhost:3000/` (Login with tenant admin credentials)
- **Customer Storefront**: `http://localhost:3000/store/{tenant_domain}` (Public access)
- **API Documentation**: `http://localhost:8000/docs` (Interactive Swagger UI)

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Multi-Tenancy](#-multi-tenancy)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

## ✨ Features

### 🏪 Multi-Tenant Architecture
- **Independent Stores**: Each tenant operates as a separate storefront
- **Data Isolation**: Complete separation of tenant data and operations
- **Custom Domains**: Each tenant can have their own domain mapping
- **Scalable Design**: Add unlimited tenants without performance degradation

### 🎨 Tenant Branding & Customization
- **Logo Upload**: Custom company logos with file management
- **Brand Colors**: Primary and secondary color customization
- **Company Information**: Description, website, contact details
- **Hero Banners**: Dynamic promotional banners with image upload
- **Flexible Display**: Toggle title visibility and banner ordering

### 🛍️ E-Commerce Features
- **Product Management**: Full CRUD operations with categories and inventory
- **Image Upload**: Product and banner image handling with tenant isolation
- **Shopping Cart**: Persistent cart with quantity management
- **Guest Checkout**: Purchase without account creation
- **Order Management**: Complete order lifecycle with status tracking
- **Payment Processing**: Mock payment gateway with validation
- **Inventory Tracking**: Real-time stock updates and low-stock alerts

### 🤖 AI Integration
- **Product Descriptions**: Auto-generate compelling descriptions using Google Gemini AI
- **Keyword-Based**: Generate content based on product names and keywords
- **Content Enhancement**: Improve existing product descriptions

### 👥 User Management & Security
- **Role-Based Access**: Super Admin, Tenant Admin, and Customer roles
- **JWT Authentication**: Secure token-based authentication
- **Password Security**: Bcrypt hashing with salt
- **Session Management**: Automatic token refresh and logout

### 📱 Responsive Design
- **Mobile-First**: Optimized for all device sizes
- **Modern UI**: Clean, professional interface
- **Touch-Friendly**: Gesture support for mobile interactions
- **Cross-Browser**: Compatible with all modern browsers

## 🛠 Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt hashing
- **AI Integration**: Google Gemini API
- **File Upload**: Local storage with tenant isolation
- **API Documentation**: Automatic OpenAPI/Swagger generation

### Frontend
- **Framework**: React 18 with functional components
- **Routing**: React Router v6
- **State Management**: Context API with hooks
- **HTTP Client**: Axios with interceptors
- **Styling**: Inline styles with responsive design
- **Build Tool**: Create React App

### DevOps & Infrastructure
- **Server**: Uvicorn ASGI server
- **Environment**: Python virtual environment
- **Database Backup**: PowerShell automation script
- **Version Control**: Git with comprehensive .gitignore
- **Documentation**: Comprehensive API docs and README

## 🏗 System Architecture

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[User Interface]
        Router[React Router]
        Context[Context API]
        Components[Reusable Components]
    end
    
    subgraph "Backend (FastAPI)"
        API[FastAPI Server]
        Auth[Authentication]
        Routers[API Routers]
        Services[Business Logic]
        CRUD[Database Operations]
    end
    
    subgraph "External Services"
        AI[Google Gemini AI]
        Storage[File Storage]
    end
    
    subgraph "Database"
        DB[(PostgreSQL)]
        Tables[Multi-Tenant Tables]
    end
    
    UI --> API
    API --> Auth
    API --> Services
    Services --> CRUD
    CRUD --> DB
    API --> AI
    API --> Storage
    
    style UI fill:#61dafb
    style API fill:#009688
    style DB fill:#336791
    style AI fill:#4285f4
```

## 📋 Prerequisites

- **Python 3.8+** (Recommended: 3.11+)
- **Node.js 16+** (Recommended: 18+)
- **PostgreSQL 12+** (Recommended: 15+)
- **Google Gemini API Key** (for AI features)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
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

## 💡 Usage

### Initial Setup

1. **Access Admin Dashboard**: Navigate to `http://localhost:3000`
2. **Register Tenant**: Create your first tenant account
3. **Login**: Use your credentials to access the admin dashboard
4. **Configure Branding**: Upload logo and set brand colors
5. **Create Products**: Add your first products with images
6. **Setup Hero Banners**: Create promotional banners for your storefront
7. **Visit Storefront**: View your store at `http://localhost:3000/store/{your-domain}`

### Admin Workflows

#### Product Management
```bash
# Add products via admin dashboard
1. Navigate to Products tab
2. Click "Add Product"
3. Fill in product details
4. Upload product image
5. Set pricing and inventory
6. Save product
```

#### Hero Banner Management
```bash
# Create promotional banners
1. Navigate to Hero Banners tab
2. Click "Add Hero Banner"
3. Upload banner image (1200x400px recommended)
4. Add title and description (optional)
5. Set link URL and button text
6. Toggle title visibility
7. Save banner
```

#### Order Management
```bash
# Process customer orders
1. Navigate to Orders tab
2. View order details
3. Update order status
4. Track inventory changes
5. Manage order lifecycle
```

### Customer Workflows

#### Shopping Experience
```bash
# Customer journey
1. Visit storefront: /store/{tenant-domain}
2. Browse products and categories
3. Add items to cart
4. Proceed to checkout
5. Enter shipping information
6. Complete payment (mock gateway)
7. Receive order confirmation
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /auth/register` - Register new tenant and admin user
- `POST /auth/token` - Login and get JWT token
- `GET /profile/me` - Get current user profile

### Product Management
- `GET /products` - List tenant products with filtering
- `POST /products` - Create new product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product
- `POST /products/upload-image` - Upload product image

### Hero Banner Management
- `GET /hero-banners` - List tenant banners
- `POST /hero-banners` - Create banner with image upload
- `PUT /hero-banners/{id}` - Update banner
- `DELETE /hero-banners/{id}` - Delete banner
- `GET /hero-banners/public/{domain}` - Get public banners for storefront

### Order Processing
- `GET /orders` - List tenant orders
- `GET /orders/{id}` - Get order details
- `PUT /orders/{id}/status` - Update order status
- `POST /store/{domain}/orders` - Create customer order
- `POST /store/{domain}/orders/guest` - Guest checkout

### AI Features
- `POST /ai/generate-description` - Generate product description

### Public Store API
- `GET /store/{domain}/products` - Public product catalog
- `GET /store/{domain}/categories` - Public categories
- `GET /store/{domain}/info` - Store information

## 🗄 Database Schema

### Core Tables
- **tenants** - Store information and branding
- **users** - Admin and customer accounts
- **products** - Product catalog with inventory
- **customers** - Customer profiles and addresses
- **orders** - Purchase orders and items
- **hero_banners** - Promotional banners
- **categories** - Product categorization

### Multi-Tenant Isolation
All tables include `tenant_id` foreign key for data isolation:
```sql
-- Example: Products are isolated by tenant
SELECT * FROM products WHERE tenant_id = ?;
```

## 🏢 Multi-Tenancy

### Tenant Isolation Strategy
- **Database Level**: All data filtered by tenant_id
- **File Storage**: Uploads stored in `/static/uploads/{tenant_id}/`
- **API Security**: All endpoints validate tenant access
- **Domain Mapping**: Each tenant accessible via unique domain

### Tenant Creation Flow
1. Register new tenant with domain name
2. First user becomes Tenant Admin
3. Tenant gets isolated data space
4. Custom branding configuration
5. Independent storefront deployment

## 📁 Project Structure

```
generation_capstone/
├── app/                          # Backend (FastAPI)
│   ├── routers/                  # API route handlers
│   │   ├── auth.py              # Authentication endpoints
│   │   ├── products.py          # Product management
│   │   ├── hero_banners.py      # Banner management
│   │   ├── orders.py            # Order processing
│   │   └── ...
│   ├── services/                # Business logic services
│   │   ├── file_upload.py       # File handling
│   │   └── payment.py           # Payment processing
│   ├── models.py                # SQLAlchemy database models
│   ├── schemas.py               # Pydantic data validation
│   ├── crud.py                  # Database operations
│   ├── security.py              # Authentication & authorization
│   └── main.py                  # FastAPI application entry
├── client/                      # Frontend (React)
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── AdminDashboard.js
│   │   │   ├── HeroBannerManagement.js
│   │   │   ├── CustomerStorefront.js
│   │   │   └── ...
│   │   ├── contexts/            # React Context providers
│   │   ├── services/            # API service layer
│   │   └── utils/               # Utility functions
│   └── public/                  # Static assets
├── backups/                     # Database backups (gitignored)
├── backup_db.ps1               # Database backup script
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🚦 Development Workflow

### Database Changes
```bash
# Always backup before schema changes
.\backup_db.ps1

# Make your changes to models.py
# Restart the server to apply changes
uvicorn app.main:app --reload
```

### Adding New Features
1. Create backup: `.\backup_db.ps1`
2. Update database models if needed
3. Add/modify API endpoints
4. Update frontend components
5. Test functionality
6. Commit changes: `git commit -m "feat: description"`
7. Push to repository: `git push origin main`

### Testing
```bash
# Backend testing
cd app
python -m pytest

# Frontend testing
cd client
npm test
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and ensure they pass
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Coding Standards
- **Python**: Follow PEP 8 with Black formatting
- **JavaScript**: Use ESLint with React best practices
- **Commits**: Use conventional commit messages
- **Documentation**: Update README for significant changes

## 📞 Support & Contact

For questions, issues, or contributions:
- **Repository**: http://100.66.17.68:3000/joshzacharytan/generation_capstone
- **Issues**: Submit issues through the repository issue tracker
- **Documentation**: API docs available at `/docs` endpoint

## 🎯 Future Enhancements

### Planned Features
- **Advanced Carousel**: Enhanced hero banner carousel with animations
- **Docker Containerization**: Full containerized deployment
- **CI/CD Pipeline**: Automated testing and deployment
- **Discount System**: Promotional codes and campaigns
- **Advanced Analytics**: Sales and customer insights
- **Email Integration**: Order confirmations and notifications
- **Payment Gateway**: Real payment processor integration
- **Multi-Language**: Internationalization support

---

**Built with ❤️ for DevOps Bootcamp Capstone Project**