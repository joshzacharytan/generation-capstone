import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerContext = createContext();

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

export const CustomerProvider = ({ children, tenantDomain }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if customer is already logged in for this tenant
    const token = localStorage.getItem(`customer_token_${tenantDomain}`);
    const customerData = localStorage.getItem(`customer_data_${tenantDomain}`);
    
    if (token && customerData) {
      try {
        const parsedCustomerData = JSON.parse(customerData);
        setCustomer({ ...parsedCustomerData, token });
      } catch (e) {
        // If parsing fails, just use token
        setCustomer({ token });
      }
    }
    setLoading(false);
  }, [tenantDomain]);

  const login = (customerData) => {
    setCustomer(customerData);
    // Store customer data in localStorage for persistence
    localStorage.setItem(`customer_data_${tenantDomain}`, JSON.stringify(customerData));
  };

  const logout = () => {
    localStorage.removeItem(`customer_token_${tenantDomain}`);
    localStorage.removeItem(`customer_data_${tenantDomain}`);
    setCustomer(null);
  };

  const value = {
    customer,
    login,
    logout,
    loading,
    isAuthenticated: !!customer
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};