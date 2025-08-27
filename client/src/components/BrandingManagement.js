import React, { useState, useEffect } from 'react';
import { brandingAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { getImageUrl } from '../utils/imageUtils';

const BrandingManagement = () => {
  const [branding, setBranding] = useState({
    company_logo_url: '',
    brand_color_primary: '#007bff',
    brand_color_secondary: '#6c757d',
    company_description: '',
    company_website: '',
    contact_email: '',
    contact_phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const response = await brandingAPI.getBranding();
      setBranding(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load branding information');
      console.error('Error fetching branding:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setBranding(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updateData = {
        brand_color_primary: branding.brand_color_primary,
        brand_color_secondary: branding.brand_color_secondary,
        company_description: branding.company_description,
        company_website: branding.company_website,
        contact_email: branding.contact_email,
        contact_phone: branding.contact_phone
      };

      await brandingAPI.updateBranding(updateData);
      setSuccess('Branding information updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update branding information');
      console.error('Error updating branding:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await brandingAPI.uploadLogo(formData);
      
      setBranding(prev => ({
        ...prev,
        company_logo_url: response.data.logo_url
      }));

      setSuccess('Logo uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the company logo?')) {
      return;
    }

    try {
      setUploading(true);
      await brandingAPI.removeLogo();
      
      setBranding(prev => ({
        ...prev,
        company_logo_url: ''
      }));

      setSuccess('Logo removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <LoadingSpinner />
        <p>Loading branding settings...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '2rem', color: '#333' }}>Store Branding</h2>

        {error && (
          <div style={{
            color: '#dc3545',
            backgroundColor: '#f8d7da',
            padding: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #f5c6cb',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            color: '#155724',
            backgroundColor: '#d4edda',
            padding: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #c3e6cb',
            marginBottom: '1rem'
          }}>
            {success}
          </div>
        )}

        {/* Company Logo Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>Company Logo</h3>
          
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '2px dashed #dee2e6'
          }}>
            {branding.company_logo_url ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={getImageUrl(branding.company_logo_url)}
                  alt="Company Logo"
                  style={{
                    maxHeight: '100px',
                    maxWidth: '200px',
                    objectFit: 'contain',
                    marginBottom: '1rem'
                  }}
                />
                <div>
                  <button
                    onClick={handleRemoveLogo}
                    disabled={uploading}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {uploading ? 'Removing...' : 'Remove Logo'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '3rem',
                  color: '#6c757d',
                  marginBottom: '1rem'
                }}>
                  🏢
                </div>
                <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                  Upload your company logo to personalize your storefront
                </p>
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
                style={{ display: 'none' }}
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: uploading ? '#6c757d' : '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size={16} style={{ marginRight: '0.5rem' }} />
                    Uploading...
                  </>
                ) : (
                  branding.company_logo_url ? 'Change Logo' : 'Upload Logo'
                )}
              </label>
            </div>
            
            <p style={{
              fontSize: '0.875rem',
              color: '#6c757d',
              textAlign: 'center',
              marginTop: '0.5rem',
              marginBottom: 0
            }}>
              Recommended: PNG, JPG, or SVG. Max size: 5MB
            </p>
          </div>
        </div>

        {/* Brand Colors Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>Brand Colors</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Primary Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="color"
                  value={branding.brand_color_primary}
                  onChange={(e) => handleInputChange('brand_color_primary', e.target.value)}
                  style={{
                    width: '50px',
                    height: '40px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={branding.brand_color_primary}
                  onChange={(e) => handleInputChange('brand_color_primary', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Secondary Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="color"
                  value={branding.brand_color_secondary}
                  onChange={(e) => handleInputChange('brand_color_secondary', e.target.value)}
                  style={{
                    width: '50px',
                    height: '40px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={branding.brand_color_secondary}
                  onChange={(e) => handleInputChange('brand_color_secondary', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Company Information Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>Company Information</h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Company Description
              </label>
              <textarea
                value={branding.company_description || ''}
                onChange={(e) => handleInputChange('company_description', e.target.value)}
                placeholder="Tell customers about your company..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Website URL
                </label>
                <input
                  type="url"
                  value={branding.company_website || ''}
                  onChange={(e) => handleInputChange('company_website', e.target.value)}
                  placeholder="https://www.yourcompany.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={branding.contact_email || ''}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="contact@yourcompany.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Contact Phone
              </label>
              <input
                type="tel"
                value={branding.contact_phone || ''}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: saving ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginLeft: 'auto'
            }}
          >
            {saving && <LoadingSpinner size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandingManagement;