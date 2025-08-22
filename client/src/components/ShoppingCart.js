import React from 'react';

const ShoppingCart = ({ cart, onUpdateQuantity, onRemoveItem, onClose, onCheckout }) => {
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>
            Shopping Cart ({getCartItemCount()} items)
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            ×
          </button>
        </div>

        {/* Cart Items */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: cart.length === 0 ? '2rem' : '0'
        }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6c757d' }}>
              <h4>Your cart is empty</h4>
              <p>Add some products to get started!</p>
            </div>
          ) : (
            <div>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  {/* Product Image */}
                  {item.image_url ? (
                    <img
                      src={`http://localhost:8000${item.image_url}`}
                      alt={item.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: '#6c757d'
                    }}>
                      No Image
                    </div>
                  )}

                  {/* Product Info */}
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 0.25rem 0', color: '#333' }}>
                      {item.name}
                    </h5>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6c757d' }}>
                      ${item.price.toFixed(2)} each
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          border: '1px solid #ddd',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        -
                      </button>
                      <span style={{ 
                        minWidth: '40px', 
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= (item.stock || 999)} // Check against available stock
                        style={{
                          width: '30px',
                          height: '30px',
                          border: '1px solid #ddd',
                          backgroundColor: item.quantity >= (item.stock || 999) ? '#f8f9fa' : 'white',
                          borderRadius: '4px',
                          cursor: item.quantity >= (item.stock || 999) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: item.quantity >= (item.stock || 999) ? '#6c757d' : '#333'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price and Remove */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 'bold',
                      color: '#28a745',
                      marginBottom: '0.5rem'
                    }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid #dee2e6',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                Total: ${getCartTotal().toFixed(2)}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                {getCartItemCount()} item{getCartItemCount() !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Continue Shopping
              </button>
              <button
                onClick={onCheckout}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;