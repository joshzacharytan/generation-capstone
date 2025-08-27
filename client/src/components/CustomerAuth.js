import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import LoadingSpinner from './LoadingSpinner';
import { getApiBaseUrl } from '../services/api';

const CustomerAuth = ({ tenantDomain, onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loginForm = useForm();
  const registerForm = useForm();

  const handleLogin = async (data) => {
    try {
      setLoading(true);
      setError('');

      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);
      formData.append('tenant_domain', tenantDomain);

      const response = await fetch(`${getApiBaseUrl()}/store/auth/login?tenant_domain=${tenantDomain}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const result = await response.json();
      
      // Store customer token
      localStorage.setItem(`customer_token_${tenantDomain}`, result.access_token);
      
      // Get customer details from the backend
      const customerResponse = await fetch(`${getApiBaseUrl()}/store/${tenantDomain}/customer/me`, {
        headers: {
          'Authorization': `Bearer ${result.access_token}`
        }
      });
      
      let customerData = { token: result.access_token, email: data.email };
      
      if (customerResponse.ok) {
        const customerDetails = await customerResponse.json();
        customerData = {
          token: result.access_token,
          email: customerDetails.email,
          first_name: customerDetails.first_name,
          last_name: customerDetails.last_name,
          phone: customerDetails.phone,
          id: customerDetails.id
        };
      }
      
      onLogin(customerData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${getApiBaseUrl()}/store/auth/register?tenant_domain=${tenantDomain}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      // Auto-login after registration
      await handleLogin({ email: data.email, password: data.password });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        maxWidth: '400px',
        width: '90%',
        padding: '2rem'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>
            {isLogin ? 'Customer Login' : 'Create Account'}
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

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email *
              </label>
              <input
                type="email"
                {...loginForm.register('email', { required: 'Email is required' })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your email"
              />
              {loginForm.formState.errors.email && (
                <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                  {loginForm.formState.errors.email.message}
                </span>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Password *
              </label>
              <input
                type="password"
                {...loginForm.register('password', { required: 'Password is required' })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your password"
              />
              {loginForm.formState.errors.password && (
                <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                  {loginForm.formState.errors.password.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: loading ? '#6c757d' : '#007bff',
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={registerForm.handleSubmit(handleRegister)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  First Name *
                </label>
                <input
                  {...registerForm.register('first_name', { required: 'First name is required' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                {registerForm.formState.errors.first_name && (
                  <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                    {registerForm.formState.errors.first_name.message}
                  </span>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Last Name *
                </label>
                <input
                  {...registerForm.register('last_name', { required: 'Last name is required' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                {registerForm.formState.errors.last_name && (
                  <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                    {registerForm.formState.errors.last_name.message}
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email *
              </label>
              <input
                type="email"
                {...registerForm.register('email', { required: 'Email is required' })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your email"
              />
              {registerForm.formState.errors.email && (
                <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                  {registerForm.formState.errors.email.message}
                </span>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Phone
              </label>
              <input
                type="tel"
                {...registerForm.register('phone')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Enter your phone number"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Password *
              </label>
              <input
                type="password"
                {...registerForm.register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                placeholder="Create a password"
              />
              {registerForm.formState.errors.password && (
                <span style={{ color: '#dc3545', fontSize: '0.875rem' }}>
                  {registerForm.formState.errors.password.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Toggle between login/register */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              loginForm.reset();
              registerForm.reset();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.9rem'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Guest checkout option */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #6c757d',
              color: '#6c757d',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;