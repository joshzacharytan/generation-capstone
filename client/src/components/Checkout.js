import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { storeAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { logDiagnostics } from '../utils/apiDiagnostics';

const Checkout = ({ cart, tenantDomain, customer, isAuthenticated, onClose, onComplete }) => {
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  const shippingForm = useForm({
    defaultValues: isAuthenticated && customer ? {
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'United States'
    } : {
      country: 'United States'
    }
  });
  const paymentForm = useForm({
    defaultValues: {
      card_number: '',
      expiry_month: '',
      expiry_year: '',
      cvv: '',
      cardholder_name: isAuthenticated && customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : ''
    }
  });

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleShippingSubmit = (data) => {
    setStep(2);
  };

  const handlePaymentSubmit = async (paymentData, retryCount = 0) => {
    try {
      setLoading(true);
      setError('');

      // Check if we're online
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      const shippingData = shippingForm.getValues();
      
      // Validate cart items
      if (!cart || cart.length === 0) {
        throw new Error('Cart is empty');
      }

      // Validate shipping data
      const requiredShippingFields = ['first_name', 'last_name', 'email', 'address_line1', 'city', 'state', 'postal_code', 'country'];
      for (const field of requiredShippingFields) {
        if (!shippingData[field]) {
          throw new Error(`Missing required field: ${field.replace('_', ' ')}`);
        }
      }

      // Validate payment data
      const requiredPaymentFields = ['card_number', 'expiry_month', 'expiry_year', 'cvv', 'cardholder_name'];
      for (const field of requiredPaymentFields) {
        if (!paymentData[field]) {
          throw new Error(`Missing required payment field: ${field.replace('_', ' ')}`);
        }
      }

      // Prepare order data
      const orderData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        shipping_address: {
          address_line1: shippingData.address_line1,
          address_line2: shippingData.address_line2 || '',
          city: shippingData.city,
          state: shippingData.state,
          postal_code: shippingData.postal_code,
          country: shippingData.country || 'United States'
        },
        payment: {
          card_number: paymentData.card_number.replace(/\s/g, ''), // Remove spaces
          expiry_month: parseInt(paymentData.expiry_month),
          expiry_year: parseInt(paymentData.expiry_year),
          cvv: paymentData.cvv,
          cardholder_name: paymentData.cardholder_name,
          amount: parseFloat(getCartTotal().toFixed(2))
        }
      };

      console.log('📦 Order data prepared:', {
        itemCount: orderData.items.length,
        totalAmount: orderData.payment.amount,
        customerEmail: shippingData.email
      });

      let response;
      
      if (isAuthenticated) {
        // Authenticated customer order
        try {
          response = await storeAPI.createOrder(tenantDomain, orderData);
        } catch (authError) {
          // If authentication fails, fall back to guest order
          console.warn('Authenticated order failed, falling back to guest order:', authError);
          const customerInfo = {
            email: customer.email || shippingData.email,
            password: 'temp123', // Temporary password for demo
            first_name: customer.first_name || shippingData.first_name,
            last_name: customer.last_name || shippingData.last_name,
            phone: customer.phone || shippingData.phone
          };
          response = await storeAPI.createGuestOrder(tenantDomain, orderData, customerInfo);
        }
      } else {
        // Guest order
        const customerInfo = {
          email: shippingData.email,
          password: 'temp123', // Temporary password for demo
          first_name: shippingData.first_name,
          last_name: shippingData.last_name,
          phone: shippingData.phone
        };
        response = await storeAPI.createGuestOrder(tenantDomain, orderData, customerInfo);
      }
      
      setOrderResult(response.data);
      setStep(3);
      
      // Clear cart immediately after successful order
      onComplete();
    } catch (err) {
      console.error('Order submission error:', err);
      console.error('Error response:', err.response);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Order failed. Please try again.';
      
      if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (err.message.includes('Network error')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (err.message.includes('Server error')) {
        errorMessage = 'Our servers are experiencing issues. Please try again in a few minutes.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.detail || 'Invalid order information. Please check your details.';
      } else if (err.response?.status === 422) {
        errorMessage = 'Validation error. Please check all required fields.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillTestCard = (cardType) => {
    const testCards = {
      visa: { number: '4532015112830366', cvv: '123' },
      mastercard: { number: '5555555555554444', cvv: '123' },
      amex: { number: '378282246310005', cvv: '1234' }
    };

    const card = testCards[cardType];
    if (card) {
      paymentForm.setValue('card_number', card.number);
      paymentForm.setValue('expiry_month', '12');
      paymentForm.setValue('expiry_year', '25');
      paymentForm.setValue('cvv', card.cvv);
      paymentForm.setValue('cardholder_name', 'Test Customer');
    }
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
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
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
            Checkout - Step {step} of 3
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

        {/* Progress Bar */}
        <div style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {[1, 2, 3].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: step >= stepNum ? '#007bff' : '#e9ecef',
                  color: step >= stepNum ? 'white' : '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 'bold'
                }}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: step > stepNum ? '#007bff' : '#e9ecef'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Shipping</span>
            <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Payment</span>
            <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Confirmation</span>
          </div>
        </div>

        {error && (
          <div style={{
            margin: '0 1.5rem',
            color: '#dc3545',
            backgroundColor: '#f8d7da',
            padding: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #f5c6cb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(error.includes('timeout') || error.includes('Network') || error.includes('Server error')) && (
                <button
                  onClick={() => {
                    setError('');
                    const paymentData = paymentForm.getValues();
                    handlePaymentSubmit(paymentData);
                  }}
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
                  Retry
                </button>
              )}
              <button
                onClick={() => logDiagnostics()}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
                title="Run network diagnostics (check browser console)"
              >
                Debug
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: '1.5rem' }}>
          {/* Step 1: Shipping Information */}
          {step === 1 && (
            <form onSubmit={shippingForm.handleSubmit(handleShippingSubmit)}>
              <h4 style={{ marginBottom: '1.5rem', color: '#333' }}>Shipping Information</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    First Name *
                  </label>
                  <input
                    {...shippingForm.register('first_name', { required: 'First name is required' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Last Name *
                  </label>
                  <input
                    {...shippingForm.register('last_name', { required: 'Last name is required' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Email *
                </label>
                <input
                  type="email"
                  {...shippingForm.register('email', { required: 'Email is required' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  {...shippingForm.register('phone')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Address Line 1 *
                </label>
                <input
                  {...shippingForm.register('address_line1', { required: 'Address is required' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Address Line 2
                </label>
                <input
                  {...shippingForm.register('address_line2')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    City *
                  </label>
                  <input
                    {...shippingForm.register('city', { required: 'City is required' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    State *
                  </label>
                  <input
                    {...shippingForm.register('state', { required: 'State is required' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    ZIP Code *
                  </label>
                  <input
                    {...shippingForm.register('postal_code', { required: 'ZIP code is required' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Country *
                </label>
                <select
                  {...shippingForm.register('country', { required: 'Country is required' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Country</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Japan">Japan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Continue to Payment
              </button>
            </form>
          )}

          {/* Step 2: Payment Information */}
          {step === 2 && (
            <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}>
              <h4 style={{ marginBottom: '1rem', color: '#333' }}>Payment Information</h4>
              
              {/* Test Cards */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6c757d' }}>
                  Use test cards for demo:
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => fillTestCard('visa')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Visa
                  </button>
                  <button
                    type="button"
                    onClick={() => fillTestCard('mastercard')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Mastercard
                  </button>
                  <button
                    type="button"
                    onClick={() => fillTestCard('amex')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Amex
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Cardholder Name *
                </label>
                <input
                  {...paymentForm.register('cardholder_name', { required: 'Cardholder name is required' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Card Number *
                </label>
                <input
                  {...paymentForm.register('card_number', { required: 'Card number is required' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Expiry Month *
                  </label>
                  <select
                    {...paymentForm.register('expiry_month', { required: 'Expiry month is required' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Month</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {String(i + 1).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Expiry Year *
                  </label>
                  <select
                    {...paymentForm.register('expiry_year', { required: 'Expiry year is required' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Year</option>
                    {[...Array(10)].map((_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    CVV *
                  </label>
                  <input
                    {...paymentForm.register('cvv', { required: 'CVV is required' })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    placeholder="123"
                    maxLength="4"
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '4px',
                marginBottom: '1.5rem'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Order Summary</h5>
                {cart.map((item) => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <hr style={{ margin: '0.5rem 0' }} />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  <span>Total:</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
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
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    backgroundColor: loading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading && <LoadingSpinner size={20} />}
                  {loading ? 'Processing...' : `Place Order - $${getCartTotal().toFixed(2)}`}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && orderResult && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                color: '#28a745'
              }}>
                ✅
              </div>
              <h4 style={{ color: '#28a745', marginBottom: '1rem' }}>
                Order Placed Successfully!
              </h4>
              <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
                Thank you for your purchase. Your order has been confirmed.
              </p>
              
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '4px',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Order Details</h5>
                <p><strong>Order Number:</strong> {orderResult.order?.order_number}</p>
                <p><strong>Total Amount:</strong> ${parseFloat(orderResult.order?.total_amount || 0).toFixed(2)}</p>
                <p><strong>Payment Status:</strong> <span style={{ color: '#28a745' }}>Paid</span></p>
                <p><strong>Transaction ID:</strong> {orderResult.payment?.transaction_id}</p>
              </div>

              <button
                onClick={onComplete}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;