import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { formatDate, formatDateTime } from '../utils/dateUtils';

const SuperAdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTenants();
      setTenants(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch tenants');
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <LoadingSpinner />
        <p>Loading tenant information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        color: '#dc3545',
        backgroundColor: '#f8d7da',
        padding: '1rem',
        borderRadius: '4px',
        border: '1px solid #f5c6cb'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#333', marginBottom: '1rem' }}>
          System Overview ({tenants.length} tenants)
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #dee2e6',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onClick={() => setSelectedTenant(tenant)}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                {tenant.name}
              </h4>
              <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                Domain: {tenant.domain}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#007bff' }}>
                  👥 {tenant.users?.length || 0} users
                </span>
                <span style={{ color: '#28a745' }}>
                  📦 {tenant.products?.length || 0} products
                </span>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6c757d' }}>
                Created: {formatDate(tenant.created_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTenant && (
        <TenantDetails 
          tenant={selectedTenant} 
          onClose={() => setSelectedTenant(null)}
          onUpdate={fetchTenants}
        />
      )}
    </div>
  );
};

const TenantDetails = ({ tenant, onClose, onUpdate }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    
    // Prevent body scrolling when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Restore body scrolling when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      // Filter users for this tenant
      const tenantUsers = response.data.filter(user => user.tenant_id === tenant.id);
      setUsers(tenantUsers);
      setError('');
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      await fetchUsers();
      onUpdate();
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => {
        // Close modal if clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden' // Prevent outer container from scrolling
      }}>
        {/* Fixed Header */}
        <div style={{ 
          padding: '2rem 2rem 0 2rem',
          borderBottom: '1px solid #dee2e6',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#333' }}>
              {tenant.name} - Details
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6c757d'
              }}
            >
              ×
            </button>
          </div>

          {error && (
            <div style={{
              color: '#dc3545',
              backgroundColor: '#f8d7da',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div style={{
          padding: '1rem 2rem 2rem 2rem',
          overflow: 'auto',
          flex: 1
        }}>

        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#333', marginBottom: '1rem' }}>Tenant Information</h4>
          <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px' }}>
            <p><strong>Name:</strong> {tenant.name}</p>
            <p><strong>Domain:</strong> {tenant.domain}</p>
            <p><strong>Created:</strong> {formatDateTime(tenant.created_at)}</p>
            <p><strong>Last Updated:</strong> {formatDateTime(tenant.updated_at)}</p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#333', marginBottom: '1rem' }}>Users ({users.length})</h4>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <LoadingSpinner />
            </div>
          ) : users.length === 0 ? (
            <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No users found</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {users.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  <div>
                    <strong>{user.email}</strong>
                    <span style={{ 
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: user.role === 'super_admin' ? '#dc3545' : '#007bff',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.75rem'
                    }}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="customer">Customer</option>
                    <option value="tenant_admin">Tenant Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 style={{ color: '#333', marginBottom: '1rem' }}>Products ({tenant.products?.length || 0})</h4>
          {tenant.products && tenant.products.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {tenant.products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  <div>
                    <strong>{product.name}</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
                      {product.description?.substring(0, 100)}...
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                      ${product.price?.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                      Stock: {product.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No products found</p>
          )}
        </div>
        {/* End Scrollable Content */}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;