import React, { useState, useEffect, useMemo } from 'react';
import { productsAPI, categoriesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { getImageUrl } from '../utils/imageUtils';

const ProductList = ({ onEdit, onDelete, refreshTrigger }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [hasAnyProducts, setHasAnyProducts] = useState(false); // Track if any products exist in database
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, low-stock, out-of-stock
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name'); // name, price, stock, date
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showFilters, setShowFilters] = useState(false);
  
  // Special filter states
  const [showSpecificProducts, setShowSpecificProducts] = useState(null); // 'high-value', 'low-inventory', etc.
  const [specificProductIds, setSpecificProductIds] = useState([]);
  
  // Smart Suggestions
  const [suggestions, setSuggestions] = useState({
    lowStock: [],
    noImage: [],
    noDescription: [],
    highValue: [],
    recentlyAdded: []
  });

  useEffect(() => {
    checkIfAnyProductsExist();
    fetchCategories();
  }, [refreshTrigger]);

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce API calls

    return () => clearTimeout(delayedFetch);
  }, [searchQuery, selectedCategory, stockFilter, priceRange, sortBy, sortOrder, showSpecificProducts, specificProductIds]);

  useEffect(() => {
    generateSmartSuggestions();
  }, [refreshTrigger]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchQuery || null,
        category: selectedCategory || null,
        stock_filter: stockFilter !== 'all' ? stockFilter : null,
        min_price: priceRange.min || null,
        max_price: priceRange.max || null,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 1000
      };
      
      const response = await productsAPI.getAll(params);
      let productsData = response.data;
      
      // Apply specific product filtering if active
      if (showSpecificProducts && specificProductIds.length > 0) {
        productsData = productsData.filter(product => specificProductIds.includes(product.id));
      }
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      // Update hasAnyProducts if we haven't checked yet or if we got results
      if (!hasAnyProducts && response.data.length > 0) {
        setHasAnyProducts(true);
      }
      
      setError('');
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfAnyProductsExist = async () => {
    try {
      // Fetch without any filters to check if database has any products
      const response = await productsAPI.getAll({ limit: 1 });
      setHasAnyProducts(response.data.length > 0);
    } catch (err) {
      console.error('Error checking products existence:', err);
      setHasAnyProducts(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };



  const generateSmartSuggestions = async () => {
    try {
      // Fetch all products without filters for suggestions
      const response = await productsAPI.getAll({ limit: 1000 });
      const allProducts = response.data;
      
      if (allProducts.length === 0) return;

      const lowStock = allProducts.filter(p => p.quantity > 0 && p.quantity <= 5).slice(0, 5);
      const lowInventory = allProducts.filter(p => p.quantity > 0 && p.quantity < 20).slice(0, 5);
      const noImage = allProducts.filter(p => !p.image_url).slice(0, 5);
      const noDescription = allProducts.filter(p => !p.description || p.description.trim().length < 10).slice(0, 5);
      const highValue = allProducts.filter(p => p.price > 0).sort((a, b) => b.price - a.price).slice(0, 5);
      const recentlyAdded = allProducts
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setSuggestions({
        lowStock,
        lowInventory,
        noImage,
        noDescription,
        highValue,
        recentlyAdded
      });
    } catch (err) {
      console.error('Error generating suggestions:', err);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setStockFilter('all');
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
    setSortOrder('asc');
    setShowSpecificProducts(null);
    setSpecificProductIds([]);
  };

  const applyQuickFilter = (filterType) => {
    clearAllFilters();
    switch (filterType) {
      case 'low-stock':
        setStockFilter('low-stock');
        break;
      case 'low-inventory':
        // Filter for items with quantity < 20
        if (suggestions.lowInventory.length > 0) {
          const lowInventoryIds = suggestions.lowInventory.map(item => item.id);
          setShowSpecificProducts('low-inventory');
          setSpecificProductIds(lowInventoryIds);
        }
        break;
      case 'high-value':
        // Filter to show only the top 5 most expensive items
        if (suggestions.highValue.length > 0) {
          const highValueIds = suggestions.highValue.map(item => item.id);
          setShowSpecificProducts('high-value');
          setSpecificProductIds(highValueIds);
        }
        break;
      case 'no-image':
        setSearchQuery(''); // Will be handled by smart suggestions
        break;
      default:
        break;
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(productId);
        setProducts(products.filter(p => p.id !== productId));
        onDelete && onDelete();
      } catch (err) {
        setError('Failed to delete product');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-primary)' }}>
        <LoadingSpinner />
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        color: 'var(--color-danger)', 
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        padding: '1rem',
        borderRadius: '4px',
        border: '1px solid rgba(220, 53, 69, 0.3)'
      }}>
        {error}
      </div>
    );
  }

  // Check if this is truly an empty database (no products at all) vs filtered results
  const hasActiveFilters = searchQuery || selectedCategory || stockFilter !== 'all' || priceRange.min || priceRange.max || showSpecificProducts;
  const isEmptyDatabase = !hasAnyProducts && !hasActiveFilters;

  if (isEmptyDatabase) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem',
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: '8px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h3 style={{ color: 'var(--text-secondary)' }}>No products yet</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Add your first product to get started!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Smart Suggestions */}
      {Object.values(suggestions).some(arr => arr.length > 0) && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 Smart Suggestions
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {suggestions.lowStock.length > 0 && (
              <button
                onClick={() => applyQuickFilter('low-stock')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff3cd',
                  color: '#856404',
                  border: '1px solid #ffeaa7',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                ⚠️ {suggestions.lowStock.length} Low Stock Items
              </button>
            )}
            {suggestions.lowInventory.length > 0 && (
              <button
                onClick={() => applyQuickFilter('low-inventory')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ffeaa7',
                  color: '#856404',
                  border: '1px solid #ffeaa7',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                📦 {suggestions.lowInventory.length} Low Inventory (&lt; 20)
              </button>
            )}
            {suggestions.noImage.length > 0 && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#d1ecf1',
                  color: '#0c5460',
                  border: '1px solid #bee5eb',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                📷 {suggestions.noImage.length} Missing Images
              </button>
            )}
            {suggestions.noDescription.length > 0 && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  border: '1px solid #f5c6cb',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                📝 {suggestions.noDescription.length} Need Descriptions
              </button>
            )}
            {suggestions.highValue.length > 0 && (
              <button
                onClick={() => applyQuickFilter('high-value')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  border: '1px solid #c3e6cb',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                💎 {suggestions.highValue.length} Most Expensive Items
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search and Filter Header */}
      <div style={{ 
        backgroundColor: 'var(--bg-elevated)',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-primary)'
      }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search products by name, description, category, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                paddingRight: '3rem',
                border: '2px solid var(--border-primary)',
                borderRadius: '25px',
                fontSize: '0.9rem',
                outline: 'none',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                transition: 'var(--theme-transition)'
              }}
            />
            <span style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }}>
              🔍
            </span>
          </div>
        </div>

        {/* Filter Toggle and Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: showFilters ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                color: showFilters ? 'var(--text-inverse)' : 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'var(--theme-transition)'
              }}
            >
              🎛️ Filters {showFilters ? '▲' : '▼'}
            </button>

            {(searchQuery || selectedCategory || stockFilter !== 'all' || priceRange.min || priceRange.max || showSpecificProducts) && (
              <button
                onClick={clearAllFilters}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--color-danger)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'var(--theme-transition)'
                }}
              >
                Clear All
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '0.5rem',
                  backgroundColor: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: viewMode === 'grid' ? 'var(--text-inverse)' : 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.5rem',
                  backgroundColor: viewMode === 'list' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: viewMode === 'list' ? 'var(--text-inverse)' : 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ☰
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Showing {filteredProducts.length} of {products.length} products
            </span>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              style={{
                padding: '0.5rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="stock-asc">Stock Low-High</option>
              <option value="stock-desc">Stock High-Low</option>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '4px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {/* Category Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock (10+)</option>
                <option value="low-stock">Low Stock (1-10)</option>
                <option value="out-of-stock">Out of Stock (0)</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Price Range
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>No products found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {searchQuery || selectedCategory || stockFilter !== 'all' || priceRange.min || priceRange.max
              ? 'Try adjusting your search criteria or filters.'
              : 'Add your first product to get started!'
            }
          </p>
          {(searchQuery || selectedCategory || stockFilter !== 'all' || priceRange.min || priceRange.max) && (
            <button
              onClick={clearAllFilters}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                marginTop: '1rem'
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          display: viewMode === 'grid' ? 'grid' : 'flex',
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: '1rem',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined
        }}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product, viewMode, onEdit, onDelete }) => {
  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: 'Out of Stock', color: '#dc3545', bg: '#f8d7da' };
    if (quantity <= 5) return { text: 'Low Stock', color: '#856404', bg: '#fff3cd' };
    if (quantity <= 10) return { text: 'Limited Stock', color: '#0c5460', bg: '#d1ecf1' };
    return { text: 'In Stock', color: '#155724', bg: '#d4edda' };
  };

  const stockStatus = getStockStatus(product.quantity);

  if (viewMode === 'list') {
    return (
      <div style={{
        backgroundColor: 'var(--bg-elevated)',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Product Image */}
        <div style={{ flexShrink: 0 }}>
          {product.image_url ? (
            <img
              src={getImageUrl(product.image_url)}
              alt={product.name}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'cover',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-tertiary)'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'var(--bg-tertiary)',
            display: product.image_url ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem'
          }}>
            No Image
          </div>
        </div>

        {/* Product Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
              {product.name}
            </h4>
            <span style={{
              fontSize: '0.75rem',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px'
            }}>
              {product.category || 'General'}
            </span>
          </div>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '0.875rem',
            margin: '0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {product.description || 'No description'}
          </p>
        </div>

        {/* Price and Stock */}
        <div style={{ textAlign: 'right', minWidth: '120px' }}>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            color: 'var(--color-success)',
            marginBottom: '0.25rem'
          }}>
            ${product.price.toFixed(2)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: stockStatus.color,
            backgroundColor: stockStatus.bg,
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            marginBottom: '0.5rem'
          }}>
            {stockStatus.text} ({product.quantity})
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '80px' }}>
          <button
            onClick={() => onEdit(product)}
            style={{
              padding: '0.5rem',
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
            onClick={() => onDelete(product.id)}
            style={{
              padding: '0.5rem',
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
    );
  }

  // Grid view (default)
  return (
    <div style={{
      backgroundColor: 'var(--bg-elevated)',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border-primary)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      height: '100%' // Ensure all cards take full height of grid cell
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      {/* Product Image */}
      <div style={{ marginBottom: '1rem', position: 'relative' }}>
        {product.image_url ? (
          <img
            src={getImageUrl(product.image_url)}
            alt={product.name}
            style={{
              width: '100%',
              height: '150px',
              objectFit: 'cover',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-tertiary)'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{
          width: '100%',
          height: '150px',
          backgroundColor: 'var(--bg-tertiary)',
          display: product.image_url ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          color: 'var(--text-secondary)'
        }}>
          📷 No Image
        </div>
        
        {/* Stock Status Badge */}
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          fontSize: '0.75rem',
          color: stockStatus.color,
          backgroundColor: stockStatus.bg,
          padding: '0.25rem 0.5rem',
          borderRadius: '12px',
          fontWeight: '500'
        }}>
          {product.quantity}
        </div>
      </div>

      {/* Product Details */}
      <div style={{ 
        flex: 1, // Take up remaining space
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h4 style={{ 
            margin: 0, 
            color: 'var(--text-primary)', 
            flex: 1, 
            marginRight: '0.5rem',
            minHeight: '2.5rem', // Reserve space for 2 lines of text
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.25'
          }}>
            {product.name}
          </h4>
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            whiteSpace: 'nowrap'
          }}>
            {product.category || 'General'}
          </span>
        </div>

        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.9rem',
          margin: '0 0 1rem 0',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.8rem' // Reserve consistent space for 2 lines
        }}>
          {product.description || 'No description available'}
        </p>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            color: 'var(--color-success)'
          }}>
            ${product.price.toFixed(2)}
          </span>
          <span style={{
            fontSize: '0.875rem',
            color: stockStatus.color,
            backgroundColor: stockStatus.bg,
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            fontWeight: '500'
          }}>
            {stockStatus.text}
          </span>
        </div>
      </div>

      {/* Action Buttons - Push to bottom */}
      <div style={{ 
        marginTop: 'auto', // Push to bottom
        display: 'flex', 
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onEdit(product)}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-primary-dark)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-primary)'}
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onDelete(product.id)}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'var(--color-danger)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-danger-dark)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-danger)'}
          >
            🗑️ Delete
          </button>
        </div>

        {/* Quick Info */}
        <div style={{
          padding: '0.5rem',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>ID: {product.id}</span>
          <span>Added: {new Date(product.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductList;