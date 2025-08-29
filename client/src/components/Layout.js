import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import ThemeToggle from './ThemeToggle';

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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'var(--bg-elevated)',
        padding: '1rem 2rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-primary)'
      }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>
            {getHeaderTitle()}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            {userRole && (
              <span style={{
                fontSize: '0.75rem',
                backgroundColor: isSuperAdmin ? 'var(--color-danger)' : 'var(--color-primary)',
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
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border-secondary)'
              }}>
                {userProfile.email}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle variant="button" showLabel={false} />
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-danger)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)', minHeight: 'calc(100vh - 100px)' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;