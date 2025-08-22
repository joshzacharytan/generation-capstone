import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import CustomerStorefront from './components/CustomerStorefront';
import ProductDetail from './components/ProductDetail';
import SearchResults from './components/SearchResults';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <div className="App">
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
      </UserProvider>
    </AuthProvider>
  );
}

export default App;