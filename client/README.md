# Generation Capstone Frontend

React frontend for the Multi-Tenant E-Commerce Platform built for DevOps bootcamp capstone demonstration.

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Production Build
```bash
# Build for production
npm run build

# Serve production build locally
npm install -g serve
serve -s build -l 3000
```

## 🐳 Docker Deployment

### Using Local Build
```bash
# Build Docker image
docker build -f ../docker/Dockerfile.frontend -t generation-capstone-frontend:v1.0.0 .

# Run container
docker run -d -p 3000:80 generation-capstone-frontend:v1.0.0
```

### Using GitHub Container Registry
```bash
# Pull and run from GHCR
docker pull ghcr.io/joshzacharytan/generation-capstone-frontend:v1.0.0
docker run -d -p 3000:80 ghcr.io/joshzacharytan/generation-capstone-frontend:v1.0.0
```

Access the application at: http://localhost:3000

## 🏗 Architecture

### Technology Stack
- **Framework**: React 18 with functional components
- **Routing**: React Router v6
- **State Management**: Context API with hooks  
- **HTTP Client**: Axios with interceptors
- **Styling**: Inline styles with responsive design
- **Build Tool**: Create React App

### Key Components
- `AdminDashboard.js` - Main admin interface
- `CustomerStorefront.js` - Public store interface
- `HeroBannerManagement.js` - Banner administration
- `ProductManagement.js` - Product CRUD operations
- `OrdersManagement.js` - Order processing
- `BrandingManagement.js` - Tenant customization

### Project Structure
```
client/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/       # React components
│   ├── contexts/         # Context providers
│   ├── services/         # API service layer
│   ├── utils/           # Utility functions
│   ├── App.js           # Main app component
│   └── index.js         # React entry point
└── package.json
```

## 🔌 API Integration

The frontend connects to the FastAPI backend:
- **Development**: http://localhost:8000
- **Production**: Configured via environment variables
- **Container**: Backend service discovery via Docker networking

### Environment Configuration
```bash
# .env.local (for development)
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in CI mode
npm test -- --watchAll=false
```

## 📦 Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder with optimized bundles

### `npm run eject`
⚠️ **One-way operation!** Ejects from Create React App for full configuration control

## 🔗 Related Resources

- **Main Repository**: https://github.com/joshzacharytan/generation-capstone
- **Backend API**: Located in `../app/` directory
- **Docker Images**: Available on GitHub Container Registry
- **API Documentation**: http://localhost:8000/docs (when backend is running)

---

**Part of the Generation Capstone Multi-Tenant E-Commerce Platform**
