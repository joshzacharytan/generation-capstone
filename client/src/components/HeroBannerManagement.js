import React, { useState, useEffect } from 'react';
import { heroBannerAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

// Helper function to get full image URL
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `http://localhost:8000${imageUrl}`;
};

function HeroBannerManagement() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    link_url: '',
    link_text: '',
    is_active: true,
    show_title: false,
    sort_order: 0
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await heroBannerAPI.getAll();
      setBanners(response.data);
    } catch (err) {
      setError('Failed to load hero banners');
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile && !editingBanner) {
      setError('Please select an image for the banner');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      if (editingBanner) {
        await heroBannerAPI.update(editingBanner.id, formDataToSend);
      } else {
        await heroBannerAPI.create(formDataToSend);
      }

      await fetchBanners();
      handleCancelForm();
      
    } catch (err) {
      setError('Failed to save hero banner: ' + (err.response?.data?.detail || err.message));
      console.error('Error saving banner:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      link_url: banner.link_url || '',
      link_text: banner.link_text || '',
      is_active: banner.is_active,
      show_title: banner.show_title || false,
      sort_order: banner.sort_order
    });
    setPreviewUrl(getFullImageUrl(banner.image_url));
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this hero banner?')) {
      return;
    }

    try {
      await heroBannerAPI.delete(bannerId);
      await fetchBanners();
    } catch (err) {
      setError('Failed to delete hero banner');
      console.error('Error deleting banner:', err);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      link_url: '',
      link_text: '',
      is_active: true,
      show_title: false,
      sort_order: 0
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
  };

  const handleAddNew = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      link_url: '',
      link_text: '',
      is_active: true,
      show_title: false,
      sort_order: 0
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setShowForm(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <LoadingSpinner />
        <p>Loading hero banners...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>Hero Banner Management</h2>
        <button
          onClick={handleAddNew}
          disabled={showForm}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: showForm ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            opacity: showForm ? 0.6 : 1
          }}
        >
          + Add Hero Banner
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {showForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>
            {editingBanner ? 'Edit Hero Banner' : 'Create New Hero Banner'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div>
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Banner headline (optional)"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  marginBottom: '1rem'
                }}
              />
            </div>
            
            <div>
              <label>Subtitle:</label>
              <textarea
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                placeholder="Banner description (optional)"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  marginBottom: '1rem'
                }}
              />
            </div>

            <div>
              <label>Link URL:</label>
              <input
                type="url"
                name="link_url"
                value={formData.link_url}
                onChange={handleInputChange}
                placeholder="https://example.com (optional)"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  marginBottom: '1rem'
                }}
              />
            </div>

            <div>
              <label>Link Text:</label>
              <input
                type="text"
                name="link_text"
                value={formData.link_text}
                onChange={handleInputChange}
                placeholder="Button text (optional)"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  marginBottom: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  style={{ marginRight: '0.5rem' }}
                />
                Active
              </label>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label>
                <input
                  type="checkbox"
                  name="show_title"
                  checked={formData.show_title}
                  onChange={handleInputChange}
                  style={{ marginRight: '0.5rem' }}
                />
                Show title on storefront
              </label>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label>Banner Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
              {!editingBanner && (
                <small style={{ color: '#6c757d', marginTop: '0.25rem', display: 'block' }}>
                  Required for new banners. Recommended size: 1200x400px.
                </small>
              )}
            </div>

            {previewUrl && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label>Preview:</label>
                <div style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  maxWidth: '600px'
                }}>
                  <img
                    src={previewUrl.startsWith('blob:') ? previewUrl : getFullImageUrl(previewUrl)}
                    alt="Banner preview"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: submitting ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {submitting ? 'Saving...' : (editingBanner ? 'Update Banner' : 'Create Banner')}
              </button>
              
              <button
                type="button"
                onClick={handleCancelForm}
                disabled={submitting}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        {banners.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>No Hero Banners</h3>
            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
              Create your first hero banner to showcase promotions.
            </p>
            <button
              onClick={handleAddNew}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Create Your First Banner
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {banners.map((banner) => (
              <div key={banner.id} style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white',
                display: 'flex'
              }}>
                <div style={{ width: '200px', flexShrink: 0 }}>
                  <img
                    src={getFullImageUrl(banner.image_url)}
                    alt={banner.title || 'Hero banner'}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </div>
                
                <div style={{ flex: 1, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                        {banner.title || 'Untitled Banner'}
                        {!banner.is_active && (
                          <span style={{
                            marginLeft: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.75rem'
                          }}>
                            Inactive
                          </span>
                        )}
                      </h4>
                      
                      {banner.subtitle && (
                        <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                          {banner.subtitle}
                        </p>
                      )}
                      
                      <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                        {banner.link_url && (
                          <span style={{ marginRight: '1rem' }}>🔗 {banner.link_text || 'Link'}</span>
                        )}
                        <span>📊 Order: {banner.sort_order}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={() => handleEdit(banner)}
                        disabled={showForm}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: showForm ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          opacity: showForm ? 0.6 : 1
                        }}
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDelete(banner.id)}
                        disabled={showForm}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: showForm ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          opacity: showForm ? 0.6 : 1
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HeroBannerManagement;