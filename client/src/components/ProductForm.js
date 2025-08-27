import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { productsAPI, aiAPI, categoriesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { getImageUrl } from '../utils/imageUtils';

const ProductForm = ({ product, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [keywords, setKeywords] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      quantity: '',
      category: 'General'
    }
  });

  const watchedName = watch('name');

  useEffect(() => {
    if (product) {
      setValue('name', product.name);
      setValue('description', product.description || '');
      setValue('price', product.price);
      setValue('quantity', product.quantity);
      setValue('category', product.category || 'General');
      
      // Set image preview if product has an image
      if (product.image_url) {
        setImagePreview(getImageUrl(product.image_url));
      }
    }
  }, [product, setValue]);

  useEffect(() => {
    // Fetch tenant's actual categories
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll(true); // Only active categories
        const categoryNames = response.data.map(cat => cat.name);
        
        // If no categories exist, fall back to default suggestions
        if (categoryNames.length === 0) {
          const fallbackResponse = await productsAPI.getCategorySuggestions();
          setCategorySuggestions(fallbackResponse.data);
        } else {
          setCategorySuggestions(categoryNames);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        // Fallback to default categories if API fails
        try {
          const fallbackResponse = await productsAPI.getCategorySuggestions();
          setCategorySuggestions(fallbackResponse.data);
        } catch (fallbackErr) {
          console.error('Failed to fetch fallback categories:', fallbackErr);
          setCategorySuggestions(['General']); // Ultimate fallback
        }
      }
    };
    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      if (product) {
        // Update existing product
        const productData = {
          name: data.name,
          description: data.description,
          price: parseFloat(data.price),
          quantity: parseInt(data.quantity),
          category: data.category
        };

        // If there's a new image, upload it first
        if (selectedImage) {
          setImageUploading(true);
          const formData = new FormData();
          formData.append('file', selectedImage);
          
          const uploadResponse = await productsAPI.uploadImage(formData);
          productData.image_url = uploadResponse.data.image_url;
          productData.image_filename = uploadResponse.data.image_filename;
        }

        await productsAPI.update(product.id, productData);
      } else {
        // Create new product with image
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description || '');
        formData.append('price', data.price);
        formData.append('quantity', data.quantity);
        formData.append('category', data.category);
        
        if (selectedImage) {
          formData.append('image', selectedImage);
        }

        await productsAPI.createWithImage(formData);
      }

      onSave();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save product');
    } finally {
      setLoading(false);
      setImageUploading(false);
    }
  };

  const generateDescription = async () => {
    if (!watchedName.trim()) {
      setError('Please enter a product name first');
      return;
    }

    try {
      setAiLoading(true);
      setError('');
      
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
      const response = await aiAPI.generateDescription(watchedName, keywordList);
      
      const responseData = response.data;
      
      // Check if the AI service returned an error or warning
      if (responseData.success === false) {
        // Handle service errors gracefully
        if (responseData.error_type === 'service_error') {
          setError(`AI Service: ${responseData.description}`);
        } else {
          setError('AI service is temporarily unavailable. Please try again or enter description manually.');
        }
        return;
      }
      
      // Check if description indicates an error (fallback check)
      if (responseData.description.startsWith('Error:') || 
          responseData.description.startsWith('Description temporarily unavailable')) {
        setError(`${responseData.description}`);
        return;
      }
      
      // Success - set the generated description
      setValue('description', responseData.description);
      
      // Show success message briefly
      const successMsg = 'Description generated successfully!';
      setError('');
      
      // Optional: Show a brief success indication
      setTimeout(() => {
        // Clear any residual error messages after successful generation
        setError('');
      }, 100);
      
    } catch (err) {
      console.error('AI description error:', err);
      
      // Use the enhanced error message from the API service
      const errorMessage = err.message || 'Failed to generate description. Please try again.';
      setError(errorMessage);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>
        {product ? 'Edit Product' : 'Add New Product'}
      </h3>

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

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Product Name *
          </label>
          <input
            {...register('name', { required: 'Product name is required' })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: errors.name ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            placeholder="Enter product name"
          />
          {errors.name && (
            <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
              {errors.name.message}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: '500' }}>Product Description</label>
            <button
              type="button"
              onClick={generateDescription}
              disabled={aiLoading || !watchedName.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: aiLoading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: aiLoading || !watchedName.trim() ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              title={!watchedName.trim() ? 'Enter a product name first' : 'Generate AI description'}
            >
              {aiLoading && <LoadingSpinner size={16} />}
              {aiLoading ? 'Generating AI...' : '✨ AI Generate'}
            </button>
          </div>
          
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Keywords for AI (comma-separated, e.g., premium, durable, eco-friendly)"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
          </div>
          
          <textarea
            {...register('description')}
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              resize: 'vertical'
            }}
            placeholder="Enter product description or use AI to generate one"
          />
        </div>

        {/* Image Upload Section */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Product Image
          </label>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
              <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: '0.5rem 0 0 0' }}>
                Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
              </p>
            </div>
            
            {imagePreview && (
              <div style={{ 
                width: '120px', 
                height: '120px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <img
                  src={imagePreview}
                  alt="Product preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Category *
          </label>
          <select
            {...register('category', { required: 'Category is required' })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: errors.category ? '1px solid #dc3545' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              backgroundColor: 'white'
            }}
          >
            {categorySuggestions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
              {errors.category.message}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('price', { 
                required: 'Price is required',
                min: { value: 0, message: 'Price must be positive' }
              })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: errors.price ? '1px solid #dc3545' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="0.00"
            />
            {errors.price && (
              <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                {errors.price.message}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Quantity *
            </label>
            <input
              type="number"
              min="0"
              {...register('quantity', { 
                required: 'Quantity is required',
                min: { value: 0, message: 'Quantity must be positive' }
              })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: errors.quantity ? '1px solid #dc3545' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="0"
            />
            {errors.quantity && (
              <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                {errors.quantity.message}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {(loading || imageUploading) && <LoadingSpinner size={20} />}
            {loading ? 'Saving...' : imageUploading ? 'Uploading image...' : (product ? 'Update Product' : 'Add Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;