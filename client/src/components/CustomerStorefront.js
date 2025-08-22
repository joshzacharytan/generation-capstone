import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { storeAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ShoppingCart from './ShoppingCart';
import Checkout from './Checkout';
import CustomerAuth from './CustomerAuth';
import CustomerAccount from './CustomerAccount';
import NetworkStatus from './NetworkStatus';
import StoreHeader from './StoreHeader';
import StoreFooter from './StoreFooter';
import HeroBannerDisplay from './HeroBannerDisplay';
import { CustomerProvider, useCustomer } from '../contexts/CustomerContext';

const CustomerStorefront = () => {
  const { tenantDomain } = useParams();

  return (
    <CustomerProvider tenantDomain={tenantDomain}>
      <CustomerStorefrontContent />
    </CustomerProvider>
  );
};

const CustomerStorefrontContent = () => {
  const { tenantDomain } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { customer, login, isAuthenticated } = useCustomer();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    // Initialize from URL parameters
    return searchParams.get('category') || '';
  });
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on component mount
    const savedCart = localStorage.getItem(`cart_${tenantDomain}`);
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Customer Filtering States
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name'); // name, price-low, price-high, newest
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);


  useEffect(() => {
    fetchStoreData();
  }, [tenantDomain, selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, priceRange, sortBy, inStockOnly]); // eslint-disable-line react-hooks/exhaustive-deps



  const fetchStoreData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch products and categories
      const [productsResponse, categoriesResponse] = await Promise.all([
        storeAPI.getProducts(tenantDomain, selectedCategory),
        storeAPI.getCategories(tenantDomain)
      ]);

      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (err) {
      setError('Failed to load store. Please check if the store exists.');
      console.error('Store loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      let newCart;
      if (existingItem) {
        newCart = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock || product.quantity) }
            : item
        );
      } else {
        newCart = [...prevCart, { ...product, quantity, stock: product.quantity }];
      }

      // Save to localStorage
      localStorage.setItem(`cart_${tenantDomain}`, JSON.stringify(newCart));
      
      // Dispatch custom event to update header cart
      window.dispatchEvent(new Event('cartUpdated'));
      
      return newCart;
    });
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart => {
        const newCart = prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: Math.min(newQuantity, item.stock || item.quantity) }
            : item
        );
        localStorage.setItem(`cart_${tenantDomain}`, JSON.stringify(newCart));
        window.dispatchEvent(new Event('cartUpdated'));
        return newCart;
      });
    }
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== productId);
      localStorage.setItem(`cart_${tenantDomain}`, JSON.stringify(newCart));
      window.dispatchEvent(new Event('cartUpdated'));
      return newCart;
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckoutComplete = () => {
    setCart([]);
    localStorage.removeItem(`cart_${tenantDomain}`); // Clear cart from localStorage
    
    // Dispatch event to update header cart display
    window.dispatchEvent(new Event('cartUpdated'));
    
    setShowCheckout(false);
    setShowCart(false);
    alert('Order placed successfully! Thank you for your purchase.');
  };

  const applyFiltersAndSort = () => {
    let filtered = [...products];

    // Price range filter
    if (priceRange.min !== '') {
      filtered = filtered.filter(product => product.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(product => product.price <= parseFloat(priceRange.max));
    }

    // In stock filter
    if (inStockOnly) {
      filtered = filtered.filter(product => product.quantity > 0);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        default: // name
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
    setInStockOnly(false);
  };

  const hasActiveFilters = priceRange.min || priceRange.max || sortBy !== 'name' || inStockOnly;

  // Handle category changes and update URL
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const newSearchParams = new URLSearchParams(searchParams);
    if (category) {
      newSearchParams.set('category', category);
    } else {
      newSearchParams.delete('category');
    }
    setSearchParams(newSearchParams);
  };

  // Update selectedCategory when URL changes (browser back/forward)
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || '';
    if (categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner />
          <p>Loading store...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#dc3545' }}>Store Not Found</h2>
          <p style={{ color: '#6c757d' }}>{error}</p>
        </div>
      </div>
    );
  }



  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <NetworkStatus />

      <StoreHeader
        tenantDomain={tenantDomain}
        showBackButton={false}
        showCart={true}
        showAuth={true}
        onCartClick={() => setShowCart(true)}
        onAuthClick={() => setShowAuth(true)}
        onAccountClick={() => setShowAccount(true)}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        
        {/* Hero Banner */}
        <HeroBannerDisplay tenantDomain={tenantDomain} />


        {/* Category Filter */}
        {categories.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleCategoryChange('')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: selectedCategory === '' ? '#007bff' : 'white',
                  color: selectedCategory === '' ? 'white' : '#333',
                  border: '1px solid #dee2e6',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: selectedCategory === category ? '#007bff' : 'white',
                    color: selectedCategory === category ? 'white' : '#333',
                    border: '1px solid #dee2e6',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter and Sort Controls */}
        {products.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              {/* Left side - Filter controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: showFilters ? '#007bff' : '#f8f9fa',
                    color: showFilters ? 'white' : '#333',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🎛️ Filters {showFilters ? '▲' : '▼'}
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Clear Filters
                  </button>
                )}

                <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  {filteredProducts.length} of {products.length} products
                </span>
              </div>

              {/* Right side - Sort control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#333' }}>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="name">Name A-Z</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                {/* Price Range Filter */}
                <div style={{ minHeight: '60px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Price Range
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: '200px' }}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      style={{
                        flex: 1,
                        minWidth: '70px',
                        padding: '0.5rem',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                    />
                    <span style={{ color: '#6c757d', whiteSpace: 'nowrap' }}>to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      style={{
                        flex: 1,
                        minWidth: '70px',
                        padding: '0.5rem',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                {/* Stock Filter */}
                <div style={{ minHeight: '60px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Availability
                  </label>
                  <div style={{ paddingTop: '0.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.875rem' }}>In Stock Only</span>
                    </label>
                  </div>
                </div>

                {/* Quick Price Filters */}
                <div style={{ minHeight: '60px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Quick Filters
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setPriceRange({ min: '', max: '50' })}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'white',
                        color: '#333',
                        border: '1px solid #dee2e6',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Under $50
                    </button>
                    <button
                      onClick={() => setPriceRange({ min: '50', max: '200' })}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'white',
                        color: '#333',
                        border: '1px solid #dee2e6',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      $50 - $200
                    </button>
                    <button
                      onClick={() => setPriceRange({ min: '200', max: '' })}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'white',
                        color: '#333',
                        border: '1px solid #dee2e6',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Over $200
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 && products.length > 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#6c757d' }}>No products match your filters</h3>
            <p style={{ color: '#6c757d' }}>
              Try adjusting your price range or other filters to see more products.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
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
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#6c757d' }}>No products available</h3>
            <p style={{ color: '#6c757d' }}>
              {selectedCategory ? `No products in "${selectedCategory}" category` : 'This store has no products yet'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                tenantDomain={tenantDomain}
                currentCategory={selectedCategory}
              />
            ))}
          </div>
        )}
      </div>

      {/* Shopping Cart Modal */}
      {showCart && (
        <ShoppingCart
          cart={cart}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onClose={() => setShowCart(false)}
          onCheckout={() => {
            setShowCart(false);
            setShowCheckout(true);
          }}
        />
      )}

      {/* Customer Authentication Modal */}
      {showAuth && (
        <CustomerAuth
          tenantDomain={tenantDomain}
          onLogin={(customerData) => {
            login(customerData);
            setShowAuth(false);
          }}
          onClose={() => setShowAuth(false)}
        />
      )}

      {/* Customer Account Modal */}
      {showAccount && (
        <CustomerAccount
          tenantDomain={tenantDomain}
          onClose={() => setShowAccount(false)}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <Checkout
          cart={cart}
          tenantDomain={tenantDomain}
          customer={customer}
          isAuthenticated={isAuthenticated}
          onClose={() => setShowCheckout(false)}
          onComplete={handleCheckoutComplete}
        />
      )}

      {/* Footer with Company Information */}
      <StoreFooter tenantDomain={tenantDomain} />
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, tenantDomain, currentCategory }) => {
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    onAddToCart(product, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  const handleProductClick = () => {
    // Include current category in the URL so back navigation works properly
    const categoryParam = currentCategory ? `?category=${encodeURIComponent(currentCategory)}` : '';
    navigate(`/store/${tenantDomain}/product/${product.id}${categoryParam}`);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      transition: 'transform 0.2s ease',
      cursor: 'pointer'
    }}
      onClick={handleProductClick}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Product Image */}
      {product.image_url ? (
        <img
          src={`http://localhost:8000${product.image_url}`}
          alt={product.name}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            backgroundColor: '#f8f9fa'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '200px',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d'
        }}>
          No Image
        </div>
      )}

      <div style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: '#e9ecef',
            color: '#495057',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px'
          }}>
            {product.category}
          </span>
        </div>

        <h3 style={{
          margin: '0 0 0.5rem 0',
          color: '#333',
          fontSize: '1.1rem',
          transition: 'color 0.2s ease'
        }}>
          {product.name}
        </h3>

        <p style={{
          color: '#6c757d',
          fontSize: '0.9rem',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.4',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {product.description || 'No description available'}
        </p>

        <div style={{
          fontSize: '0.8rem',
          color: '#007bff',
          marginBottom: '1rem',
          fontWeight: '500'
        }}>
          Click to view details →
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#28a745'
          }}>
            ${product.price.toFixed(2)}
          </span>
          <span style={{
            color: product.quantity > 0 ? '#28a745' : '#dc3545',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
          </span>
        </div>

        {product.quantity > 0 ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={quantity}
              onChange={(e) => {
                e.stopPropagation(); // Prevent navigation when changing quantity
                setQuantity(parseInt(e.target.value));
              }}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              {[...Array(Math.min(product.quantity, 10))].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddToCart}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              Add to Cart
            </button>
          </div>
        ) : (
          <button
            disabled
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'not-allowed',
              fontSize: '0.9rem'
            }}
          >
            Out of Stock
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomerStorefront;