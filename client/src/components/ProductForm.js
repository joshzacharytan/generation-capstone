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
  const [imageUploadType, setImageUploadType] = useState('file'); // 'file' or 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [urlUploading, setUrlUploading] = useState(false);
  
  // Upload history for fallback functionality
  const [uploadHistory, setUploadHistory] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);

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
      
      // Set image preview and initialize upload history if product has an image
      if (product.image_url) {
        const initialImage = {
          image_url: product.image_url,
          image_filename: product.image_filename,
          isFromUrl: false,
          isOriginal: true,
          uploadType: 'existing',
          timestamp: new Date().toISOString()
        };
        setUploadHistory([initialImage]);
        setCurrentImageIndex(0);
        setSelectedImage(initialImage);
        setImagePreview(getImageUrl(product.image_url));
      } else {
        setUploadHistory([]);
        setCurrentImageIndex(-1);
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
      
      // Create upload history entry
      const newUpload = {
        file: file,
        isFromUrl: false,
        uploadType: 'file',
        timestamp: new Date().toISOString(),
        name: file.name
      };
      
      // Add to history and set as current
      const newHistory = [...uploadHistory, newUpload];
      setUploadHistory(newHistory);
      setCurrentImageIndex(newHistory.length - 1);
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleUrlImageUpload = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    try {
      setUrlUploading(true);
      setError('');
      
      const response = await productsAPI.uploadImageFromUrl(imageUrl.trim());
      
      // Create upload history entry
      const newUpload = {
        isFromUrl: true,
        image_url: response.data.image_url,
        image_filename: response.data.image_filename,
        source_url: imageUrl.trim(),
        uploadType: 'url',
        timestamp: new Date().toISOString()
      };
      
      // Add to history and set as current
      const newHistory = [...uploadHistory, newUpload];
      setUploadHistory(newHistory);
      setCurrentImageIndex(newHistory.length - 1);
      setSelectedImage(newUpload);
      
      // Set the preview
      setImagePreview(getImageUrl(response.data.image_url));
      
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload image from URL');
    } finally {
      setUrlUploading(false);
    }
  };

  const switchToUpload = (index) => {
    if (index >= 0 && index < uploadHistory.length) {
      const upload = uploadHistory[index];
      setCurrentImageIndex(index);
      setSelectedImage(upload);
      
      if (upload.file) {
        // File upload - create preview from file
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(upload.file);
      } else if (upload.image_url) {
        // URL upload or existing image
        setImagePreview(getImageUrl(upload.image_url));
      }
    }
  };

  const removeFromHistory = (index) => {
    if (uploadHistory.length <= 1) {
      // Don't remove if it's the only image
      return;
    }
    
    const newHistory = uploadHistory.filter((_, i) => i !== index);
    setUploadHistory(newHistory);
    
    if (currentImageIndex === index) {
      // If removing current image, switch to the last one
      const newIndex = Math.min(currentImageIndex, newHistory.length - 1);
      setCurrentImageIndex(newIndex);
      if (newIndex >= 0) {
        switchToUpload(newIndex);
      } else {
        setSelectedImage(null);
        setImagePreview(null);
        setCurrentImageIndex(-1);
      }
    } else if (currentImageIndex > index) {
      // Adjust current index if needed
      setCurrentImageIndex(currentImageIndex - 1);
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
          
          if (selectedImage.isFromUrl) {
            // Image was already uploaded from URL
            productData.image_url = selectedImage.image_url;
            productData.image_filename = selectedImage.image_filename;
          } else {
            // Upload file
            const formData = new FormData();
            formData.append('file', selectedImage);
            
            const uploadResponse = await productsAPI.uploadImage(formData);
            productData.image_url = uploadResponse.data.image_url;
            productData.image_filename = uploadResponse.data.image_filename;
          }
        }

        await productsAPI.update(product.id, productData);
      } else {
        // Create new product
        if (selectedImage && selectedImage.isFromUrl) {
          // Image was uploaded from URL, create product with image data
          const productData = {
            name: data.name,
            description: data.description || '',
            price: parseFloat(data.price),
            quantity: parseInt(data.quantity),
            category: data.category,
            image_url: selectedImage.image_url,
            image_filename: selectedImage.image_filename
          };
          
          await productsAPI.create(productData);
        } else {
          // Create new product with file upload
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
      backgroundColor: 'var(--bg-elevated)',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-lg)',
      maxWidth: '600px',
      margin: '0 auto',
      border: '1px solid var(--border-primary)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
          {product ? 'Edit Product' : 'Add New Product'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ← Back to Products
        </button>
      </div>

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
              border: errors.name ? '1px solid var(--color-danger)' : '1px solid var(--border-primary)',
              borderRadius: '4px',
              fontSize: '1rem',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)'
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
            <label style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Product Description</label>
            <button
              type="button"
              onClick={generateDescription}
              disabled={aiLoading || !watchedName.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: aiLoading ? 'var(--text-secondary)' : 'var(--color-success)',
                color: 'var(--text-inverse)',
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
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          
          <textarea
            {...register('description')}
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-primary)',
              borderRadius: '4px',
              fontSize: '1rem',
              resize: 'vertical',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)'
            }}
            placeholder="Enter product description or use AI to generate one"
          />
        </div>

        {/* Image Upload Section */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            Product Image
          </label>
          
          {/* Upload Type Toggle */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '1rem',
            border: '1px solid var(--border-primary)',
            borderRadius: '4px',
            padding: '0.5rem',
            backgroundColor: 'var(--bg-tertiary)'
          }}>
            <button
              type="button"
              onClick={() => {
                setImageUploadType('file');
                setImageUrl('');
                setError('');
              }}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                backgroundColor: imageUploadType === 'file' ? 'var(--color-primary)' : 'transparent',
                color: imageUploadType === 'file' ? 'var(--text-inverse)' : 'var(--text-primary)',
                transition: 'var(--theme-transition)'
              }}
            >
              📁 Upload File
            </button>
            <button
              type="button"
              onClick={() => {
                setImageUploadType('url');
                setSelectedImage(null);
                setError('');
              }}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                backgroundColor: imageUploadType === 'url' ? 'var(--color-primary)' : 'transparent',
                color: imageUploadType === 'url' ? 'var(--text-inverse)' : 'var(--text-primary)',
                transition: 'var(--theme-transition)'
              }}
            >
              🔗 From URL
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              {imageUploadType === 'file' ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
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
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                    Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                  </p>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleUrlImageUpload}
                      disabled={urlUploading || !imageUrl.trim()}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: urlUploading || !imageUrl.trim() ? 'var(--text-secondary)' : 'var(--color-success)',
                        color: 'var(--text-inverse)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: urlUploading || !imageUrl.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {urlUploading && <LoadingSpinner size={16} />}
                      {urlUploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                    Enter a direct link to an image. Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                  </p>
                </>
              )}
            </div>
            
            {imagePreview && (
              <div style={{ 
                width: '120px', 
                height: '120px', 
                border: '1px solid var(--border-primary)', 
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-tertiary)'
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
          
          {/* Upload History */}
          {uploadHistory.length > 1 && (
            <div style={{ marginTop: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                Upload History ({uploadHistory.length} images)
              </label>
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                flexWrap: 'wrap',
                padding: '0.5rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                border: '1px solid var(--border-primary)'
              }}>
                {uploadHistory.map((upload, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: currentImageIndex === index ? 'var(--color-primary)' : 'var(--bg-elevated)',
                      color: currentImageIndex === index ? 'var(--text-inverse)' : 'var(--text-primary)',
                      borderRadius: '4px',
                      border: '1px solid ' + (currentImageIndex === index ? 'var(--color-primary)' : 'var(--border-primary)'),
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      transition: 'var(--theme-transition)'
                    }}
                    onClick={() => switchToUpload(index)}
                    title={upload.uploadType === 'url' ? `URL: ${upload.source_url}` : 
                           upload.uploadType === 'file' ? `File: ${upload.name}` : 'Original image'}
                  >
                    <span>
                      {upload.uploadType === 'existing' && '📄'}
                      {upload.uploadType === 'file' && '📁'}
                      {upload.uploadType === 'url' && '🔗'}
                    </span>
                    <span>
                      {upload.uploadType === 'existing' ? 'Original' :
                       upload.uploadType === 'file' ? 'File' :
                       'URL'}
                    </span>
                    {currentImageIndex === index && (
                      <span style={{ 
                        marginLeft: '0.25rem',
                        fontWeight: 'bold'
                      }}>✓</span>
                    )}
                    {uploadHistory.length > 1 && !upload.isOriginal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(index);
                        }}
                        style={{
                          marginLeft: '0.25rem',
                          padding: '0',
                          width: '16px',
                          height: '16px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem'
                        }}
                        title="Remove this upload"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)', 
                margin: '0.5rem 0 0 0',
                fontStyle: 'italic'
              }}>
                💡 Latest upload will be used as primary. Click on any upload to switch to it.
              </p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            Category *
          </label>
          <select
            {...register('category', { required: 'Category is required' })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: errors.category ? '1px solid var(--color-danger)' : '1px solid var(--border-primary)',
              borderRadius: '4px',
              fontSize: '1rem',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)'
            }}
          >
            {categorySuggestions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>
              {errors.category.message}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
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
                border: errors.price ? '1px solid var(--color-danger)' : '1px solid var(--border-primary)',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
              placeholder="0.00"
            />
            {errors.price && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>
                {errors.price.message}
              </span>
            )}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
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
                border: errors.quantity ? '1px solid var(--color-danger)' : '1px solid var(--border-primary)',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
              placeholder="0"
            />
            {errors.quantity && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>
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
              backgroundColor: 'var(--text-secondary)',
              color: 'var(--text-inverse)',
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
              backgroundColor: loading ? 'var(--text-secondary)' : 'var(--color-primary)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {(loading || imageUploading || urlUploading) && <LoadingSpinner size={20} />}
            {loading ? 'Saving...' : 
             imageUploading ? 'Uploading image...' : 
             urlUploading ? 'Processing URL...' : 
             (product ? 'Update Product' : 'Add Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;