import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import CustomerStorefront from './components/CustomerStorefront';
import ProductDetail from './components/ProductDetail';
import SearchResults from './components/SearchResults';
import ThemeToggle from './components/ThemeToggle';

import './App.css';
import './styles/theme.css';

const AppContent = () => {
  const location = useLocation();
  
  // Only show fixed theme toggle on storefront pages
  const isStorefrontPage = location.pathname.startsWith('/store');
  
  return (
    <div className="App">
      {/* Fixed Theme Toggle - Only on Storefront Pages */}
      {isStorefrontPage && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          pointerEvents: 'auto'
        }}>
          <ThemeToggle variant="icon" showLabel={false} />
        </div>
      )}

      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        {/* Customer Storefront Routes */}
        <Route path="/store/:tenantDomain" element={<CustomerStorefront />} />
        <Route path="/store/:tenantDomain/product/:productId" element={<ProductDetail />} />
        <Route path="/store/:tenantDomain/search" element={<SearchResults />} />
        
        {/* Redirect old route */}
        <Route path="/admin-dashboard" element={<Navigate to="/dashboard" replace />} />
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;