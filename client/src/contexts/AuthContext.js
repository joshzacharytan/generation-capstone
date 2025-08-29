import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('access_token');
      if (token) {
        // Check if token is expired (basic JWT check)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp && payload.exp < currentTime) {
            // Token is expired
            localStorage.removeItem('access_token');
            setUser(null);
          } else {
            // Token appears valid, set user
            setUser({ token });
            
            // Optional: Try to validate with server in background
            try {
              const response = await fetch('http://localhost:8000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (response.ok) {
                const userData = await response.json();
                setUser({ token, ...userData });
              } else if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('access_token');
                setUser(null);
              }
            } catch (error) {
              // Server validation failed, but keep token for offline use
              console.warn('Token validation failed, using offline mode:', error);
            }
          }
        } catch (error) {
          // Token parsing failed, assume it's valid for backward compatibility
          console.warn('Could not parse token, assuming valid:', error);
          setUser({ token });
        }
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      
      // Store token if localStorage is available
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('access_token', data.access_token);
      }
      
      // Store user data including email for persistence
      const userData = {
        token: data.access_token,
        email: email,
        ...data.user // Include any additional user data from response
      };
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (email, password, tenantName, tenantDomain) => {
    try {
      await authAPI.register(email, password, tenantName, tenantDomain);
      // Auto-login after registration
      return await login(email, password);
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('access_token');
    }
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};