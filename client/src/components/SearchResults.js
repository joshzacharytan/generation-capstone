import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { storeAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import NetworkStatus from './NetworkStatus';
import StoreHeader from './StoreHeader';
import StoreFooter from './StoreFooter';
import ShoppingCart from './ShoppingCart';
import Checkout from './Checkout';
import CustomerAuth from './CustomerAuth';
import { getImageUrl } from '../utils/imageUtils';
import CustomerAccount from './CustomerAccount';
import { CustomerProvider, useCustomer } from '../contexts/CustomerContext';

const SearchResults = () => {
  return (
    <CustomerProvider tenantDomain={useParams().tenantDomain}>
      <SearchResultsContent />
    </CustomerProvider>
  );
};

const SearchResultsContent = () => {
  const { tenantDomain } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { customer, login, logout, isAuthenticated } = useCustomer();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(`cart_${tenantDomain}`);
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    if (searchQuery) {
      searchProducts();
    }
  }, [tenantDomain, searchQuery]);

  const searchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await storeAPI.searchProducts(tenantDomain, searchQuery);
      setProducts(response.data);
    } catch (err) {
      setError('Failed to search products. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, quantity = 1) => {
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    let newCart;
    
    if (existingItemIndex >= 0) {
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.quantity) }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity, stock: product.quantity }];
    }
    
    setCart(newCart);
    localStorage.setItem(`cart_${tenantDomain}`, JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      const newCart = cart.map(item =>
        item.id === productId 
          ? { ...item, quantity: Math.min(newQuantity, item.stock || item.quantity) } 
          : item
      );
      setCart(newCart);
      localStorage.setItem(`cart_${tenantDomain}`, JSON.stringify(newCart));
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    localStorage.setItem(`cart_${tenantDomain}`, JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckoutComplete = () => {
    setCart([]);
    localStorage.removeItem(`cart_${tenantDomain}`);
    window.dispatchEvent(new Event('cartUpdated'));
    setShowCheckout(false);
    setShowCart(false);
    alert('Order placed successfully! Thank you for your purchase.');
  };

  const handleSearch = (query) => {
    if (query.trim()) {
      navigate(`/store/${tenantDomain}/search?q=${encodeURIComponent(query)}`);
    } else {
      navigate(`/store/${tenantDomain}`);
    }
  };

  const handleBackToStore = () => {
    navigate(`/store/${tenantDomain}`);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center', color: 'var(--text-primary)' }}>
          <LoadingSpinner />
          <p>Searching products...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <NetworkStatus />
      
      <StoreHeader
        tenantDomain={tenantDomain}
        onSearch={handleSearch}
        showBackButton={true}
        onBackClick={handleBackToStore}
        showCart={true}
        showAuth={true}
        onCartClick={() => setShowCart(true)}
        onAuthClick={() => setShowAuth(true)}
        onAccountClick={() => setShowAccount(true)}
        searchMode="submit"
        initialSearchQuery={searchQuery}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Search Results Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Search Results for "{searchQuery}"
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-danger-subtle)',
            color: 'var(--color-danger)',
            borderRadius: '4px',
            border: '1px solid var(--border-danger)',
            marginBottom: '2rem'
          }}>
            {error}
          </div>
        )}

        {/* Search Results */}
        {products.length === 0 && !loading ? (
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
              Try searching with different keywords or browse our categories.
            </p>
            <button
              onClick={handleBackToStore}
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
              Browse All Products
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                tenantDomain={tenantDomain}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
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

      {showAccount && (
        <CustomerAccount
          tenantDomain={tenantDomain}
          onClose={() => setShowAccount(false)}
        />
      )}

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

      {/* Footer */}
      <StoreFooter tenantDomain={tenantDomain} />
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, tenantDomain }) => {
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  const handleProductClick = () => {
    navigate(`/store/${tenantDomain}/product/${product.id}`);
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-elevated)',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden',
      transition: 'transform 0.2s ease',
      cursor: 'pointer',
      border: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%' // Ensure all cards take full height of grid cell
    }}
      onClick={handleProductClick}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Product Image */}
      {product.image_url ? (
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            backgroundColor: 'var(--bg-tertiary)'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '200px',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}>
          No Image
        </div>
      )}

      <div style={{ 
        padding: '1.5rem',
        flex: 1, // Take up remaining space
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px'
          }}>
            {product.category}
          </span>
        </div>

        <h3 style={{
          margin: '0 0 0.5rem 0',
          color: 'var(--text-primary)',
          fontSize: '1.1rem',
          transition: 'color 0.2s ease',
          minHeight: '2.75rem', // Reserve space for 2 lines of text
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.25'
        }}>
          {product.name}
        </h3>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          margin: '0 0 0.5rem 0',
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
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--color-success)'
          }}>
            ${product.price.toFixed(2)}
          </span>
          <span style={{
            color: product.quantity > 0 ? 'var(--color-success)' : 'var(--color-danger)',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
          </span>
        </div>

        {/* Action Section - Push to bottom */}
        <div style={{ marginTop: 'auto' }}>
          {product.quantity > 0 ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={quantity}
                onChange={(e) => {
                  e.stopPropagation();
                  setQuantity(parseInt(e.target.value));
                }}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)'
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
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'var(--theme-transition)'
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
                backgroundColor: 'var(--color-secondary)',
                color: 'var(--text-inverse)',
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
    </div>
  );
};

export default SearchResults;