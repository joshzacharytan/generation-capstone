// @ts-nocheck
import React, { useState } from 'react';
import Layout from './Layout';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import ProfileSettings from './ProfileSettings';
import SuperAdminDashboard from './SuperAdminDashboard';
import OrdersManagement from './OrdersManagement';
import PaymentTest from './PaymentTest';
import CategoriesManagement from './CategoriesManagement';
import BrandingManagement from './BrandingManagement';
import { useUser } from '../contexts/UserContext';
import LoadingSpinner from './LoadingSpinner';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { loading, isSuperAdmin } = useUser();

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleProductSaved = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancelForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <LoadingSpinner />
          <p>Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'branding', label: 'Branding', icon: '🎨' },
    { id: 'payment-test', label: 'Payment Test', icon: '💳' },
    ...(isSuperAdmin ? [{ id: 'admin', label: 'System Admin', icon: '⚙️' }] : []),
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #dee2e6',
          marginBottom: '2rem'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowProductForm(false);
              }}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #007bff' : '2px solid transparent',
                color: activeTab === tab.id ? '#007bff' : '#6c757d',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: activeTab === tab.id ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'products' && (
          <div>
            {showProductForm ? (
              <ProductForm
                product={editingProduct}
                onSave={handleProductSaved}
                onCancel={handleCancelForm}
              />
            ) : (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2rem'
                }}>
                  <h2 style={{ margin: 0, color: '#333' }}>Product Management</h2>
                  <button
                    onClick={handleAddProduct}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span>+</span>
                    Add Product
                  </button>
                </div>

                <ProductList
                  onEdit={handleEditProduct}
                  onDelete={() => setRefreshTrigger(prev => prev + 1)}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <h2 style={{ marginBottom: '2rem', color: '#333' }}>Category Management</h2>
            <CategoriesManagement />
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 style={{ marginBottom: '2rem', color: '#333' }}>Order Management</h2>
            <OrdersManagement />
          </div>
        )}

        {activeTab === 'branding' && (
          <div>
            <BrandingManagement />
          </div>
        )}

        {activeTab === 'payment-test' && (
          <div>
            <PaymentTest />
          </div>
        )}

        {activeTab === 'admin' && isSuperAdmin && (
          <div>
            <h2 style={{ marginBottom: '2rem', color: '#333' }}>System Administration</h2>
            <SuperAdminDashboard />
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <h2 style={{ marginBottom: '2rem', color: '#333' }}>Profile Settings</h2>
            <ProfileSettings />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;