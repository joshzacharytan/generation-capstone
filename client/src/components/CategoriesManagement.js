import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { formatDateTime } from '../utils/dateUtils';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll(false); // Include inactive categories
      setCategories(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? If products use this category, it will be deactivated instead.')) {
      try {
        const response = await categoriesAPI.delete(categoryId);
        alert(response.data.message);
        fetchCategories();
      } catch (err) {
        setError('Failed to delete category');
      }
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      const response = await categoriesAPI.initializeDefaults();
      alert(response.data.message);
      fetchCategories();
    } catch (err) {
      setError('Failed to initialize default categories');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-primary)' }}>
        <LoadingSpinner />
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{
          color: 'var(--color-danger)',
          backgroundColor: 'var(--bg-danger-subtle)',
          padding: '1rem',
          borderRadius: '4px',
          border: '1px solid var(--border-danger)',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {!showForm ? (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
              Category Management ({categories.length} categories)
            </h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {categories.length === 0 && (
                <button
                  onClick={handleInitializeDefaults}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--color-info)',
                    color: 'var(--text-inverse)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Initialize Defaults
                </button>
              )}
              <button
                onClick={handleAddCategory}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--color-success)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                + Add Category
              </button>
            </div>
          </div>

          {categories.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '8px',
              border: '1px solid var(--border-primary)'
            }}>
              <h4 style={{ color: 'var(--text-secondary)' }}>No categories yet</h4>
              <p style={{ color: 'var(--text-secondary)' }}>Create categories to organize your products better.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {categories.map((category) => (
                <div
                  key={category.id}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border-primary)',
                    opacity: category.is_active ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: category.color,
                            borderRadius: '4px',
                            border: '1px solid var(--border-primary)'
                          }}
                        />
                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>
                          {category.name}
                          {!category.is_active && (
                            <span style={{
                              marginLeft: '0.5rem',
                              fontSize: '0.75rem',
                              backgroundColor: 'var(--text-secondary)',
                              color: 'var(--text-inverse)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px'
                            }}>
                              INACTIVE
                            </span>
                          )}
                        </h4>
                      </div>
                      
                      {category.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                          {category.description}
                        </p>
                      )}
                      
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <span>Order: {category.sort_order}</span>
                        <span style={{ margin: '0 1rem' }}>•</span>
                        <span>Created: {formatDateTime(category.created_at)}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditCategory(category)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--text-inverse)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--color-danger)',
                          color: 'var(--text-inverse)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <CategoryForm
          category={editingCategory}
          onSave={handleFormClose}
          onCancel={handleFormClose}
        />
      )}
    </div>
  );
};

const CategoryForm = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007bff',
    is_active: true,
    sort_order: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color,
        is_active: category.is_active,
        sort_order: category.sort_order
      });
    }
  }, [category]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (category) {
        await categoriesAPI.update(category.id, formData);
      } else {
        await categoriesAPI.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    { value: '#007bff', label: 'Blue' },
    { value: '#28a745', label: 'Green' },
    { value: '#dc3545', label: 'Red' },
    { value: '#ffc107', label: 'Yellow' },
    { value: '#17a2b8', label: 'Cyan' },
    { value: '#6f42c1', label: 'Purple' },
    { value: '#fd7e14', label: 'Orange' },
    { value: '#20c997', label: 'Teal' },
    { value: '#6c757d', label: 'Gray' },
    { value: '#343a40', label: 'Dark' }
  ];

  return (
    <div style={{
      backgroundColor: 'var(--bg-elevated)',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-lg)',
      maxWidth: '600px',
      margin: '0 auto',
      border: '1px solid var(--border-primary)'
    }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        {category ? 'Edit Category' : 'Add New Category'}
      </h3>

      {error && (
        <div style={{
          color: 'var(--color-danger)',
          backgroundColor: 'var(--bg-danger-subtle)',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid var(--border-danger)'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            Category Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-primary)',
              borderRadius: '4px',
              fontSize: '1rem',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)'
            }}
            placeholder="Enter category name"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-primary)',
              borderRadius: '4px',
              fontSize: '1rem',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              resize: 'vertical'
            }}
            placeholder="Optional description for this category"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              Color
            </label>
            <select
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            >
              {colorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              Sort Order
            </label>
            <input
              type="number"
              name="sort_order"
              value={formData.sort_order}
              onChange={handleInputChange}
              min="0"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
            />
            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Active</span>
          </label>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 1.5rem' }}>
            Inactive categories won't appear in product forms
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'var(--theme-transition)'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? 'var(--color-secondary)' : 'var(--color-primary)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'var(--theme-transition)'
            }}
          >
            {loading && <LoadingSpinner size={20} />}
            {loading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoriesManagement;