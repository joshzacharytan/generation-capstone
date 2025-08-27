import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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

const ProductDetail = () => {
  return (
    <CustomerProvider tenantDomain={useParams().tenantDomain}>
      <ProductDetailContent />
    </CustomerProvider>
  );
};

const ProductDetailContent = () => {
  const { tenantDomain, productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customer, login, logout, isAuthenticated } = useCustomer();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(`cart_${tenantDomain}`);
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [tenantDomain, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await storeAPI.getProduct(tenantDomain, productId);
      setProduct(response.data);
    } catch (err) {
      setError('Failed to load product. Please try again.');
      console.error('Product loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    setAddingToCart(true);
    
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    let newCart;
    
    if (existingItemIndex >= 0) {
      // Update quantity
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.quantity) }
          : item
      );
    } else {
      // Add new item
      newCart = [...cart, { ...product, quantity, stock: product.quantity }];
    }
    
    setCart(newCart);
    localStorage.setItem(`cart_${tenantDomain}`, JSON.stringify(newCart));
    
    // Dispatch custom event for header to update
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Show success message
    setTimeout(() => {
      setAddingToCart(false);
      alert(`Added ${quantity} ${product.name}(s) to cart!`);
    }, 500);
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
    // Only navigate on form submit, not on every keystroke
    if (query.trim()) {
      navigate(`/store/${tenantDomain}?search=${encodeURIComponent(query)}`);
    }
  };

  const handleBackToStore = () => {
    // Check if we have a category parameter to navigate back to
    const category = searchParams.get('category');
    if (category) {
      navigate(`/store/${tenantDomain}?category=${encodeURIComponent(category)}`);
    } else {
      navigate(`/store/${tenantDomain}`);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner />
          <p>Loading product...</p>
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
        <NetworkStatus />
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#dc3545' }}>Product Not Found</h2>
          <p style={{ color: '#6c757d' }}>{error}</p>
          <button
            onClick={handleBackToStore}
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
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
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
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Product Image */}
          <div style={{ position: 'relative' }}>
            {product.image_url ? (
              <img
                src={getImageUrl(product.image_url)}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '500px',
                  objectFit: 'cover',
                  backgroundColor: '#f8f9fa'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{
              width: '100%',
              height: '500px',
              backgroundColor: '#f8f9fa',
              display: product.image_url ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6c757d',
              fontSize: '1.2rem'
            }}>
              No Image Available
            </div>
          </div>

          {/* Product Details */}
          <div style={{ padding: '2rem' }}>
            {/* Category Badge */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{
                fontSize: '0.875rem',
                backgroundColor: '#e9ecef',
                color: '#495057',
                padding: '0.5rem 1rem',
                borderRadius: '20px'
              }}>
                {product.category}
              </span>
            </div>

            {/* Product Name */}
            <h1 style={{
              margin: '0 0 1rem 0',
              color: '#333',
              fontSize: '2.5rem',
              fontWeight: 'bold'
            }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#28a745',
              marginBottom: '1.5rem'
            }}>
              ${product.price.toFixed(2)}
            </div>

            {/* Stock Status */}
            <div style={{
              marginBottom: '1.5rem',
              padding: '0.75rem',
              backgroundColor: product.quantity > 0 ? '#d4edda' : '#f8d7da',
              color: product.quantity > 0 ? '#155724' : '#721c24',
              borderRadius: '4px',
              border: `1px solid ${product.quantity > 0 ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {product.quantity > 0 ? (
                <span>✅ In Stock ({product.quantity} available)</span>
              ) : (
                <span>❌ Out of Stock</span>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Description</h3>
              <p style={{
                color: '#6c757d',
                lineHeight: '1.6',
                fontSize: '1.1rem'
              }}>
                {product.description || 'No description available for this product.'}
              </p>
            </div>

            {/* Add to Cart Section */}
            {product.quantity > 0 && (
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <label style={{
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    Quantity:
                  </label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      minWidth: '80px'
                    }}
                  >
                    {[...Array(Math.min(product.quantity, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: addingToCart ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: addingToCart ? 'not-allowed' : 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {addingToCart && <LoadingSpinner size={20} />}
                  {addingToCart ? 'Adding to Cart...' : `Add ${quantity} to Cart - $${(product.price * quantity).toFixed(2)}`}
                </button>
              </div>
            )}

            {product.quantity === 0 && (
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8d7da',
                borderRadius: '8px',
                border: '1px solid #f5c6cb',
                textAlign: 'center'
              }}>
                <h4 style={{ color: '#721c24', margin: '0 0 0.5rem 0' }}>
                  Out of Stock
                </h4>
                <p style={{ color: '#721c24', margin: 0 }}>
                  This product is currently unavailable.
                </p>
              </div>
            )}
          </div>
        </div>
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

      {/* Footer */}
      <StoreFooter tenantDomain={tenantDomain} />
    </div>
  );
};

export default ProductDetail;