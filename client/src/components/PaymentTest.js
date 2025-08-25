import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const PaymentTest = () => {
  const [testCards, setTestCards] = useState({});
  const [selectedCard, setSelectedCard] = useState('');
  const [paymentData, setPaymentData] = useState({
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    cardholder_name: '',
    amount: '99.99'
  });
  const [validationResult, setValidationResult] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTestCards();
  }, []);

  const fetchTestCards = async () => {
    try {
      const response = await paymentAPI.getTestCards();
      setTestCards(response.data.cards);
    } catch (err) {
      console.error('Failed to fetch test cards:', err);
    }
  };

  const handleTestCardSelect = (cardType) => {
    const cardNumber = testCards[cardType];
    setSelectedCard(cardType);
    setPaymentData({
      ...paymentData,
      card_number: cardNumber,
      expiry_month: '12',
      expiry_year: '25',
      cvv: cardType === 'amex' ? '1234' : '123',
      cardholder_name: 'Test Customer'
    });
    setValidationResult(null);
    setPaymentResult(null);
  };

  const handleInputChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
    setValidationResult(null);
    setPaymentResult(null);
  };

  const validateCard = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.validateCard(paymentData);
      setValidationResult(response.data);
    } catch (err) {
      setValidationResult({ valid: false, error: 'Validation failed' });
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.processPayment(paymentData);
      setPaymentResult(response.data);
    } catch (err) {
      setPaymentResult({ 
        success: false, 
        error: err.response?.data?.detail || 'Payment failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Payment Gateway Test</h2>
      
      {/* Test Cards */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Test Credit Cards</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {Object.entries(testCards).map(([cardType, cardNumber]) => (
            <button
              key={cardType}
              onClick={() => handleTestCardSelect(cardType)}
              style={{
                padding: '1rem',
                backgroundColor: selectedCard === cardType ? 'var(--color-primary)' : 'var(--bg-elevated)',
                color: selectedCard === cardType ? 'var(--text-inverse)' : 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'var(--theme-transition)'
              }}
            >
              <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                {cardType}
              </div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {cardNumber}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Form */}
      <div style={{ 
        backgroundColor: 'var(--bg-elevated)', 
        padding: '2rem', 
        borderRadius: '8px', 
        boxShadow: 'var(--shadow-md)',
        marginBottom: '2rem',
        border: '1px solid var(--border-primary)'
      }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Payment Details</h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              Card Number
            </label>
            <input
              type="text"
              name="card_number"
              value={paymentData.card_number}
              onChange={handleInputChange}
              placeholder="1234 5678 9012 3456"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--input-border)',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                transition: 'var(--theme-transition)'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                Expiry Month
              </label>
              <input
                type="number"
                name="expiry_month"
                value={paymentData.expiry_month}
                onChange={handleInputChange}
                placeholder="12"
                min="1"
                max="12"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--input-border)',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  transition: 'var(--theme-transition)'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                Expiry Year
              </label>
              <input
                type="number"
                name="expiry_year"
                value={paymentData.expiry_year}
                onChange={handleInputChange}
                placeholder="25"
                min="24"
                max="35"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--input-border)',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  transition: 'var(--theme-transition)'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                CVV
              </label>
              <input
                type="text"
                name="cvv"
                value={paymentData.cvv}
                onChange={handleInputChange}
                placeholder="123"
                maxLength="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--input-border)',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  transition: 'var(--theme-transition)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              Cardholder Name
            </label>
            <input
              type="text"
              name="cardholder_name"
              value={paymentData.cardholder_name}
              onChange={handleInputChange}
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--input-border)',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                transition: 'var(--theme-transition)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              Amount ($)
            </label>
            <input
              type="number"
              name="amount"
              value={paymentData.amount}
              onChange={handleInputChange}
              placeholder="99.99"
              step="0.01"
              min="0.01"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--input-border)',
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-primary)',
                transition: 'var(--theme-transition)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={validateCard}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#6c757d' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading && <LoadingSpinner size={20} />}
            Validate Card
          </button>
          
          <button
            onClick={processPayment}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading && <LoadingSpinner size={20} />}
            Process Payment
          </button>
        </div>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <div style={{
          backgroundColor: validationResult.valid ? '#d4edda' : '#f8d7da',
          color: validationResult.valid ? '#155724' : '#721c24',
          padding: '1rem',
          borderRadius: '4px',
          border: `1px solid ${validationResult.valid ? '#c3e6cb' : '#f5c6cb'}`,
          marginBottom: '1rem'
        }}>
          <h4>Validation Result</h4>
          {validationResult.valid ? (
            <div>
              <p>✅ Card is valid!</p>
              <p><strong>Card Type:</strong> {validationResult.card_type}</p>
              <p><strong>Last Four:</strong> ****{validationResult.last_four}</p>
            </div>
          ) : (
            <p>❌ {validationResult.error}</p>
          )}
        </div>
      )}

      {/* Payment Result */}
      {paymentResult && (
        <div style={{
          backgroundColor: paymentResult.success ? '#d4edda' : '#f8d7da',
          color: paymentResult.success ? '#155724' : '#721c24',
          padding: '1rem',
          borderRadius: '4px',
          border: `1px solid ${paymentResult.success ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          <h4>Payment Result</h4>
          {paymentResult.success ? (
            <div>
              <p>✅ Payment processed successfully!</p>
              <p><strong>Transaction ID:</strong> {paymentResult.transaction_id}</p>
              <p><strong>Authorization Code:</strong> {paymentResult.authorization_code}</p>
              <p><strong>Card Type:</strong> {paymentResult.card_type}</p>
              <p><strong>Last Four:</strong> ****{paymentResult.last_four}</p>
              <p><strong>Amount:</strong> ${paymentResult.amount}</p>
            </div>
          ) : (
            <p>❌ {paymentResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentTest;