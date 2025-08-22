import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const Layout = ({ children }) => {
  const { logout } = useAuth();
  const { userProfile, tenantName, userRole, isSuperAdmin, loading } = useUser();

  const handleLogout = () => {
    logout();
  };

  const getHeaderTitle = () => {
    if (loading) return 'Loading...';
    if (isSuperAdmin) return 'System Administration';
    if (tenantName) return `${tenantName} - Admin Panel`;
    return 'E-Commerce Admin';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#fff',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
            {getHeaderTitle()}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            {userRole && (
              <span style={{
                fontSize: '0.75rem',
                backgroundColor: isSuperAdmin ? '#dc3545' : '#007bff',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                display: 'inline-block'
              }}>
                {userRole.replace('_', ' ').toUpperCase()}
              </span>
            )}
            {userProfile?.email && (
              <span style={{
                fontSize: '0.75rem',
                color: '#6c757d',
                backgroundColor: '#e9ecef',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px'
              }}>
                {userProfile.email}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;