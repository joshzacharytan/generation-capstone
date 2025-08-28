import axios from 'axios';

// Dynamic API base URL that works with NGINX reverse proxy
const getApiBaseUrl = () => {
  // Check if we're running in a browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    console.log('API Base URL: Checking hostname:', hostname);
    
    // Check for environment variable override first
    if (process.env.REACT_APP_API_BASE_URL && !process.env.REACT_APP_API_BASE_URL.includes('#')) {
      console.log('API Base URL: Using environment variable:', process.env.REACT_APP_API_BASE_URL);
      return process.env.REACT_APP_API_BASE_URL;
    }
    
    // For localhost, use direct backend connection (development)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('API Base URL: Development mode - direct to FastAPI backend');
      return 'http://localhost:8000';
    }
    
    // For any other domain (production/staging), use relative paths through NGINX proxy
    console.log('API Base URL: Production/Staging domain - using relative paths through NGINX proxy');
    return '/api';  // Relative path - NGINX will proxy to backend
  }
  
  // Fallback for server-side rendering or non-browser environments
  console.log('API Base URL: Fallback to localhost');
  return 'http://localhost:8000';
};

// Create axios instance with default config
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor to dynamically set the baseURL
api.interceptors.request.use(
  (config) => {
    // Set baseURL dynamically for each request
    config.baseURL = getApiBaseUrl();
    console.log('API Request:', config.method?.toUpperCase(), config.baseURL, config.url, config);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to log all responses
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url, response);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response) {
      console.error('API Response Error Details:', error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    // Use multiple custom headers that Cloudflare is less likely to strip
    config.headers['X-Auth-Token'] = token;
    config.headers['X-User-Token'] = token;
    config.headers['X-API-Key'] = token;
    // Also try Authorization as fallback
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect for admin routes, not store routes
      if (error.config?.url?.includes('/admin') || error.config?.url?.includes('/products') || error.config?.url?.includes('/categories')) {
        localStorage.removeItem('access_token');
        window.location.href = '/';
      }
      // For store routes, just log the error but don't redirect
      console.warn('Authentication error on store route:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

// Auth API - Updated to use relative paths with explicit full URLs for direct calls
export const authAPI = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    // For auth endpoints, we might need to make direct calls in development
    const baseUrl = getApiBaseUrl();
    const url = baseUrl.startsWith('/api') ? `${baseUrl}/auth/token` : `${baseUrl}/auth/token`;
    
    const response = await axios.post(url, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },

  register: async (email, password, tenantName, tenantDomain) => {
    const baseUrl = getApiBaseUrl();
    const url = baseUrl.startsWith('/api') ? `${baseUrl}/auth/register` : `${baseUrl}/auth/register`;
    
    const response = await axios.post(url, {
      email,
      password,
      tenant_name: tenantName,
      tenant_domain: tenantDomain
    });
    return response.data;
  }
};

// Products API
export const productsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    const queryString = queryParams.toString();
    return api.get(`/products${queryString ? `?${queryString}` : ''}`);
  },
  getAnalytics: () => api.get('/products/analytics'),
  create: (product) => api.post('/products', product),
  update: (id, product) => api.put(`/products/${id}`, product),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  getCategorySuggestions: () => api.get('/products/categories/suggestions'),
  uploadImage: (formData) => api.post('/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createWithImage: (formData) => api.post('/products/create-with-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// AI API
export const aiAPI = {
  generateDescription: async (productName, keywords) => {
    try {
      return await api.post('/ai/generate-description', {
        product_name: productName,
        keywords
      }, {
        timeout: 20000 // 20 second timeout for AI requests
      });
    } catch (error) {
      console.error('AI description generation failed:', error);
      
      // Enhanced error handling for AI service
      if (error.code === 'ECONNABORTED') {
        throw new Error('AI service is taking too long to respond. Please try again or enter description manually.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'Invalid request. Please check the product name.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please sign in again.');
      } else if (error.response?.status >= 500) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else if (!error.response) {
        throw new Error('Unable to connect to AI service. Please check your connection.');
      }
      
      // Re-throw the original error if not handled above
      throw error;
    }
  }
};

// Profile API
export const profileAPI = {
  getCurrentUser: () => api.get('/profile/me'),

  updatePassword: (oldPassword, newPassword) =>
    api.put('/profile/password', {
      old_password: oldPassword,
      new_password: newPassword
    }),

  updateEmail: (newEmail) =>
    api.put('/profile/email', { new_email: newEmail }),

  deleteAccount: () => api.delete('/profile')
};

// Orders API
export const ordersAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    const queryString = queryParams.toString();
    return api.get(`/orders/${queryString ? `?${queryString}` : ''}`);
  },
  getCount: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    const queryString = queryParams.toString();
    return api.get(`/orders/count${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  // Analytics endpoints
  getAnalyticsOverview: (days = 30, categoryId = null) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (categoryId) params.append('category_id', categoryId.toString());
    return api.get(`/orders/analytics/overview?${params.toString()}`);
  },
  getRevenueTrend: (days = 30, categoryId = null) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (categoryId) params.append('category_id', categoryId.toString());
    return api.get(`/orders/analytics/revenue-trend?${params.toString()}`);
  },
  getTopProducts: (days = 30, limit = 10, categoryId = null) => {
    const params = new URLSearchParams({ days: days.toString(), limit: limit.toString() });
    if (categoryId) params.append('category_id', categoryId.toString());
    return api.get(`/orders/analytics/top-products?${params.toString()}`);
  }
};

// Payment API
export const paymentAPI = {
  validateCard: (cardData) => api.post('/payment/validate-card', cardData),
  processPayment: (paymentData) => api.post('/payment/process', paymentData)
};

// Store API (for customer-facing operations)
export const storeAPI = {
  getProducts: (tenantDomain, category = null) => {
    const params = category ? `?category=${category}` : '';
    return api.get(`/store/${tenantDomain}/products${params}`);
  },
  getProduct: (tenantDomain, productId) =>
    api.get(`/store/${tenantDomain}/products/${productId}`),
  getCategories: (tenantDomain) =>
    api.get(`/store/${tenantDomain}/categories`),
  createOrder: async (tenantDomain, orderData) => {
    const token = localStorage.getItem(`customer_token_${tenantDomain}`);
    try {
      return await api.post(`/store/${tenantDomain}/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
    } catch (error) {
      console.error('Order creation failed:', error);
      // Enhanced error handling
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - please check your connection and try again');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed - please sign in again');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'Invalid order data');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else if (!error.response) {
        throw new Error('Network error - please check your connection');
      }
      throw error;
    }
  },
  createGuestOrder: async (tenantDomain, orderData, customerInfo) => {
    try {
      return await api.post(`/store/${tenantDomain}/orders/guest`, {
        ...orderData,
        customer_info: customerInfo
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // 30 second timeout
      });
    } catch (error) {
      console.error('Guest order creation failed:', error);
      // Enhanced error handling
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - please check your connection and try again');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'Invalid order data');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else if (!error.response) {
        throw new Error('Network error - please check your connection');
      }
      throw error;
    }
  },
  getCustomerProfile: (tenantDomain) => {
    const token = localStorage.getItem(`customer_token_${tenantDomain}`);
    return api.get(`/store/${tenantDomain}/customer/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  searchProducts: async (tenantDomain, query) => {
    try {
      return await api.get(`/store/${tenantDomain}/search?q=${encodeURIComponent(query)}`, {
        timeout: 10000
      });
    } catch (error) {
      console.error('Product search failed:', error);
      throw error;
    }
  },
  getSearchSuggestions: async (tenantDomain, query) => {
    try {
      return await api.get(`/store/${tenantDomain}/search/suggestions?q=${encodeURIComponent(query)}`, {
        timeout: 5000
      });
    } catch (error) {
      console.error('Search suggestions failed:', error);
      throw error;
    }
  },
  getTenantInfo: async (tenantDomain) => {
    try {
      return await api.get(`/store/${tenantDomain}/info`, {
        timeout: 5000
      });
    } catch (error) {
      console.error('Failed to get tenant info:', error);
      throw error;
    }
  },
  getHeroBanners: async (tenantDomain) => {
    try {
      return await api.get(`/hero-banners/public/${tenantDomain}`, {
        timeout: 5000
      });
    } catch (error) {
      console.error('Failed to get hero banners:', error);
      throw error;
    }
  }
};

// Categories API
export const categoriesAPI = {
  getAll: (activeOnly = true) => api.get(`/categories/?active_only=${activeOnly}`),
  getById: (id) => api.get(`/categories/${id}`),
  create: (category) => api.post('/categories/', category),
  update: (id, category) => api.put(`/categories/${id}`, category),
  delete: (id) => api.delete(`/categories/${id}`),
  initializeDefaults: () => api.post('/categories/initialize-defaults'),
  reorder: (id, newOrder) => api.put(`/categories/${id}/reorder?new_order=${newOrder}`)
};

// Branding API
export const brandingAPI = {
  getBranding: () => api.get('/branding/'),
  updateBranding: (brandingData) => api.put('/branding/', brandingData),
  uploadLogo: (formData) => api.post('/branding/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  removeLogo: () => api.delete('/branding/logo')
};

// Admin API
export const adminAPI = {
  getTenants: () => api.get('/admin/tenants'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) =>
    api.put(`/admin/users/${userId}/role`, { role })
};

// Hero Banner API
export const heroBannerAPI = {
  getAll: (activeOnly = false) => api.get(`/hero-banners/?active_only=${activeOnly}`),
  getById: (id) => api.get(`/hero-banners/${id}`),
  create: (formData) => api.post('/hero-banners/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/hero-banners/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/hero-banners/${id}`),
  getPublic: (tenantDomain) => api.get(`/hero-banners/public/${tenantDomain}`)
};

export default api;

// Export the getApiBaseUrl function for use in components
export { getApiBaseUrl };