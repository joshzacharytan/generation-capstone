import React, { useState, useEffect } from 'react';
import { storeAPI } from '../services/api';

const StoreFooter = ({ tenantDomain }) => {
  const [tenantInfo, setTenantInfo] = useState(null);

  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        const response = await storeAPI.getTenantInfo(tenantDomain);
        setTenantInfo(response.data);
      } catch (error) {
        console.error('Failed to load tenant info for footer:', error);
      }
    };

    if (tenantDomain) {
      fetchTenantInfo();
    }
  }, [tenantDomain]);

  if (!tenantInfo) return null;

  const hasContactInfo = tenantInfo.contact_email || tenantInfo.contact_phone || tenantInfo.company_website;
  const hasDescription = tenantInfo.company_description;

  if (!hasContactInfo && !hasDescription) return null;

  return (
    <footer style={{
      backgroundColor: 'var(--bg-elevated)',
      borderTop: '1px solid var(--border-primary)',
      marginTop: '3rem',
      padding: '2rem 0'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasDescription ? '2fr 1fr' : '1fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Company Description */}
          {hasDescription && (
            <div>
              <h3 style={{ 
                color: tenantInfo.brand_color_primary || 'var(--text-primary)',
                marginBottom: '1rem',
                fontSize: '1.2rem'
              }}>
                About {tenantDomain}
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                margin: 0
              }}>
                {tenantInfo.company_description}
              </p>
            </div>
          )}

          {/* Contact Information */}
          {hasContactInfo && (
            <div>
              <h3 style={{ 
                color: tenantInfo.brand_color_primary || 'var(--text-primary)',
                marginBottom: '1rem',
                fontSize: '1.2rem'
              }}>
                Contact Us
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tenantInfo.contact_email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>📧</span>
                    <a 
                      href={`mailto:${tenantInfo.contact_email}`}
                      style={{
                        color: tenantInfo.brand_color_primary || 'var(--color-primary)',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      {tenantInfo.contact_email}
                    </a>
                  </div>
                )}

                {tenantInfo.contact_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>📞</span>
                    <a 
                      href={`tel:${tenantInfo.contact_phone}`}
                      style={{
                        color: tenantInfo.brand_color_primary || 'var(--color-primary)',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      {tenantInfo.contact_phone}
                    </a>
                  </div>
                )}

                {tenantInfo.company_website && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>🌐</span>
                    <a 
                      href={tenantInfo.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: tenantInfo.brand_color_primary || 'var(--color-primary)',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      Visit our website
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-primary)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem'
        }}>
          © {new Date().getFullYear()} {tenantDomain}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;