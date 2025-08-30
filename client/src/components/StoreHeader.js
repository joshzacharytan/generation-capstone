import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../contexts/CustomerContext';
import { storeAPI } from '../services/api';
import SearchBox from './SearchBox';
import { getImageUrl } from '../utils/imageUtils';

const StoreHeader = ({ 
  tenantDomain, 
  onSearch, 
  showBackButton = false, 
  onBackClick,
  showCart = true,
  showAuth = true,
  onCartClick,
  onAuthClick,
  onAccountClick,
  initialSearchQuery = ""
}) => {
  const navigate = useNavigate();
  const { customer, login, logout, isAuthenticated } = useCustomer();
  const [cart, setCart] = useState([]);
  const [tenantBranding, setTenantBranding] = useState(null);

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem(`cart_${tenantDomain}`);
      setCart(savedCart ? JSON.parse(savedCart) : []);
    };

    loadCart();
    
    // Listen for cart updates
    const handleStorageChange = () => {
      loadCart();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab cart updates
    window.addEventListener('cartUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleStorageChange);
    };
  }, [tenantDomain]);

  // Load tenant branding information
  useEffect(() => {
    const fetchTenantBranding = async () => {
      try {
        // Get tenant info from store API (we need to add this endpoint)
        const response = await storeAPI.getTenantInfo(tenantDomain);
        setTenantBranding(response.data);
      } catch (error) {
        console.error('Failed to load tenant branding:', error);
      }
    };

    if (tenantDomain) {
      fetchTenantBranding();
    }
  }, [tenantDomain]);

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };



  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    }
  };

  const handleAuthClick = () => {
    if (onAuthClick) {
      onAuthClick();
    }
  };

  const handleAccountClick = () => {
    if (onAccountClick) {
      onAccountClick();
    }
  };

  // Check if mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <header style={{
        backgroundColor: 'var(--bg-elevated)',
        padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
        boxShadow: 'var(--shadow-md)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--border-primary)',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {/* Top row on mobile: Logo, Store Name, and essential buttons */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '0.5rem',
            minWidth: isMobile ? 'auto' : '200px' 
          }}>
            {/* Left side: Back button and Logo/Store name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              {showBackButton && (
                <button
                  onClick={onBackClick}
                  style={{
                    padding: isMobile ? '0.5rem' : '0.5rem 1rem',
                    backgroundColor: 'var(--text-secondary)',
                    color: 'var(--text-inverse)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    minHeight: '44px'
                  }}
                >
                  {isMobile ? '←' : '← Back'}
                </button>
              )}
              
              {/* Company Logo */}
              {tenantBranding?.company_logo_url && (
                <img
                  src={getImageUrl(tenantBranding.company_logo_url)}
                  alt={`${tenantDomain} Logo`}
                  style={{
                    height: isMobile ? '32px' : '40px',
                    maxWidth: isMobile ? '80px' : '120px',
                    objectFit: 'contain',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/store/${tenantDomain}`)}
                />
              )}
              
              {/* Store Name */}
              <h1 
                style={{ 
                  margin: 0, 
                  color: tenantBranding?.brand_color_primary || 'var(--text-primary)', 
                  textTransform: 'capitalize',
                  fontSize: isMobile ? '1rem' : (showBackButton ? '1.2rem' : '1.5rem'),
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                onClick={() => navigate(`/store/${tenantDomain}`)}
              >
                {isMobile ? tenantDomain : `${tenantDomain} Store`}
              </h1>
            </div>

            {/* Right side: Essential buttons only on mobile */}
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Cart button - always show on mobile */}
                {showCart && (
                  <button
                    onClick={handleCartClick}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--text-inverse)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      minHeight: '44px',
                      minWidth: '44px',
                      position: 'relative'
                    }}
                  >
                    🛒
                    {getCartItemCount() > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: 'var(--color-danger)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getCartItemCount()}
                      </span>
                    )}
                  </button>
                )}
                
                {/* Auth button */}
                {showAuth && (
                  <>
                    {isAuthenticated ? (
                      <button
                        onClick={handleAccountClick}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: 'var(--color-info)',
                          color: 'var(--text-inverse)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          minHeight: '44px',
                          minWidth: '44px'
                        }}
                      >
                        👤
                      </button>
                    ) : (
                      <button
                        onClick={handleAuthClick}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: 'var(--color-success)',
                          color: 'var(--text-inverse)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          minHeight: '44px'
                        }}
                      >
                        Sign In
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Search Bar - full width on mobile, center on desktop */}
          <div style={{ 
            flex: isMobile ? 'none' : 1, 
            maxWidth: isMobile ? 'none' : '400px',
            width: isMobile ? '100%' : 'auto'
          }}>
            <SearchBox 
              key={`${tenantDomain}-${initialSearchQuery || 'empty'}`}
              tenantDomain={tenantDomain}
              initialValue={initialSearchQuery}
              placeholder={isMobile ? "Search..." : "Search products, brands, categories..."}
            />
          </div>

          {/* Desktop Right Section - Hidden on mobile */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '300px', justifyContent: 'flex-end' }}>
              {showAuth && (
                <>
                  {isAuthenticated ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Welcome, {customer?.first_name ? `${customer.first_name} ${customer.last_name}` : customer?.email}
                      </span>
                      <button
                        onClick={handleAccountClick}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--color-info)',
                          color: 'var(--text-inverse)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        My Orders
                      </button>
                      <button
                        onClick={logout}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--text-secondary)',
                          color: 'var(--text-inverse)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAuthClick}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--color-success)',
                        color: 'var(--text-inverse)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Sign In
                    </button>
                  )}
                </>
              )}

              {/* Shopping Cart */}
              {showCart && (
                <button
                  onClick={handleCartClick}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--text-inverse)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '1rem'
                  }}
                >
                  🛒 Cart ({getCartItemCount()})
                  {getCartItemCount() > 0 && (
                    <span style={{ fontWeight: 'bold' }}>
                      ${getCartTotal().toFixed(2)}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Modals would be rendered here - for now we'll use the existing ones from CustomerStorefront */}
    </>
  );
};

export default StoreHeader;