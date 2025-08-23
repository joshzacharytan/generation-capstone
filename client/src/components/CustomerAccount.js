import React, { useState, useEffect } from 'react';
import { useCustomer } from '../contexts/CustomerContext';
import LoadingSpinner from './LoadingSpinner';
import { formatDateTime } from '../utils/dateUtils';

const CustomerAccount = ({ tenantDomain, onClose }) => {
  const { customer } = useCustomer();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersPerPage] = useState(10);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Loading states
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (customer) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchOrders(true); // true = reset orders
      fetchOrdersCount();
    }
  }, [customer, statusFilter, searchQuery, dateFilter]);

  useEffect(() => {
    if (customer && currentPage > 1) {
      fetchOrders(false); // false = append to existing orders
    }
  }, [currentPage]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    
    // Cleanup: restore body scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const fetchOrders = async (resetOrders = true) => {
    try {
      const loadingState = currentPage === 1 || resetOrders;
      if (loadingState) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const token = localStorage.getItem(`customer_token_${tenantDomain}`);
      const skip = resetOrders ? 0 : (currentPage - 1) * ordersPerPage;
      
      // Build query parameters
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: ordersPerPage.toString()
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (dateFilter !== 'all') {
        const now = new Date();
        let dateFrom;
        
        switch (dateFilter) {
          case 'week':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case '3months':
            dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case 'year':
            dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        }
        
        if (dateFrom) {
          params.append('date_from', dateFrom.toISOString());
        }
      }
      
      const response = await fetch(`http://localhost:8000/store/${tenantDomain}/customer/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (resetOrders || currentPage === 1) {
          setOrders(data);
        } else {
          setOrders(prev => [...prev, ...data]);
        }
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (err) {
      setError('Failed to load order history');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchOrdersCount = async () => {
    try {
      const token = localStorage.getItem(`customer_token_${tenantDomain}`);
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (dateFilter !== 'all') {
        const now = new Date();
        let dateFrom;
        
        switch (dateFilter) {
          case 'week':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case '3months':
            dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case 'year':
            dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        }
        
        if (dateFrom) {
          params.append('date_from', dateFrom.toISOString());
        }
      }
      
      const response = await fetch(`http://localhost:8000/store/${tenantDomain}/customer/orders/count?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTotalOrders(data.total);
      }
    } catch (err) {
      console.error('Error fetching orders count:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders(true);
    fetchOrdersCount();
  };

  const loadMoreOrders = () => {
    setCurrentPage(prev => prev + 1);
  };

  const getTotalPages = () => {
    return Math.ceil(totalOrders / ordersPerPage);
  };

  const hasMoreOrders = () => {
    return currentPage < getTotalPages();
  };

  const getDateFilterLabel = (filter) => {
    const labels = {
      'week': 'Last 7 Days',
      'month': 'Last Month',
      '3months': 'Last 3 Months',
      'year': 'Last Year'
    };
    return labels[filter] || filter;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#17a2b8',
      processing: '#007bff',
      shipped: '#28a745',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflow: 'hidden' // Prevent scroll bleed-through
      }}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '900px',
          width: '90%',
          height: '85vh', // Fixed height instead of maxHeight
          minHeight: '600px', // Minimum height for smaller screens
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
              My Orders
            </h3>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
              {totalOrders > 0 ? `${totalOrders} order${totalOrders !== 1 ? 's' : ''} found` : 'No orders found'}
              {statusFilter !== 'all' && ` • Filtered by: ${statusFilter}`}
              {dateFilter !== 'all' && ` • ${getDateFilterLabel(dateFilter)}`}
            </p>
          </div>
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

        {/* Customer Info */}
        <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
          <p style={{ margin: 0, color: '#333' }}>
            <strong>{customer.first_name} {customer.last_name}</strong> • {customer.email}
          </p>
        </div>

        {/* Filters Section */}
        <div style={{ 
          padding: '1rem 1.5rem', 
          backgroundColor: '#ffffff', 
          borderBottom: '2px solid #f8f9fa'
        }}>
          {/* Status Filter Tabs */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'All Orders', count: totalOrders },
                { key: 'pending', label: 'Pending', emoji: '⏳' },
                { key: 'confirmed', label: 'Confirmed', emoji: '✓' },
                { key: 'processing', label: 'Processing', emoji: '🔄' },
                { key: 'shipped', label: 'Shipped', emoji: '🚚' },
                { key: 'delivered', label: 'Delivered', emoji: '📦' },
                { key: 'cancelled', label: 'Cancelled', emoji: '❌' }
              ].map(status => (
                <button
                  key={status.key}
                  onClick={() => setStatusFilter(status.key)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: statusFilter === status.key ? '#007bff' : 'white',
                    color: statusFilter === status.key ? 'white' : '#495057',
                    border: '1px solid #dee2e6',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {status.emoji && <span>{status.emoji}</span>}
                  {status.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Search and Date Filter Row */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center', 
            flexWrap: 'wrap'
          }}>
            {/* Search */}
            <form onSubmit={handleSearch} style={{ flex: '1', minWidth: '200px' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Search by order number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  🔍
                </button>
              </div>
            </form>
            
            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '0.9rem',
                minWidth: '120px'
              }}
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
            
            {/* Clear Filters */}
            {(statusFilter !== 'all' || searchQuery || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                  setDateFilter('all');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div style={{ 
          flex: 1, 
          overflow: 'hidden',
          minHeight: '300px', // Ensure minimum content area
          display: 'flex',
          flexDirection: 'column'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minHeight: '300px'
            }}>
              <LoadingSpinner />
              <p>Loading your orders...</p>
            </div>
          ) : error ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minHeight: '300px',
              color: '#dc3545',
              padding: '2rem'
            }}>
              <p>{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minHeight: '300px',
              color: '#6c757d',
              padding: '2rem',
              textAlign: 'center'
            }}>
              {statusFilter === 'all' && !searchQuery && dateFilter === 'all' ? (
                <>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                  <h4>No orders yet</h4>
                  <p>Your order history will appear here after you make your first purchase.</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  <h4>No orders found</h4>
                  <p>Try adjusting your filters or search criteria.</p>
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setSearchQuery('');
                      setDateFilter('all');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    Clear All Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ 
              flex: 1, 
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ 
                padding: '0',
                flex: 1
              }}>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderBottom: '1px solid #f8f9fa',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onClick={() => setSelectedOrder(order)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h5 style={{ margin: '0 0 0.25rem 0', color: '#333' }}>
                          Order #{order.order_number}
                        </h5>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6c757d' }}>
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          color: '#28a745',
                          marginBottom: '0.25rem'
                        }}>
                          ${parseFloat(order.total_amount).toFixed(2)}
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          backgroundColor: getStatusColor(order.status),
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          textTransform: 'uppercase'
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6c757d' }}>
                      {order.order_items?.length || 0} item(s) • Click to view details
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Load More Section */}
              {hasMoreOrders() && (
                <div style={{ 
                  padding: '1.5rem', 
                  textAlign: 'center', 
                  borderTop: '1px solid #f8f9fa',
                  marginTop: 'auto' // Push to bottom
                }}>
                  <button
                    onClick={loadMoreOrders}
                    disabled={loadingMore}
                    style={{
                      padding: '0.75rem 2rem',
                      backgroundColor: loadingMore ? '#6c757d' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '25px',
                      cursor: loadingMore ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto'
                    }}
                  >
                    {loadingMore ? (
                      <>
                        <LoadingSpinner />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Orders
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                          ({orders.length} of {totalOrders})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {/* End Message */}
              {!hasMoreOrders() && orders.length > 0 && (
                <div style={{ 
                  padding: '1rem', 
                  textAlign: 'center', 
                  color: '#6c757d', 
                  fontSize: '0.85rem', 
                  borderTop: '1px solid #f8f9fa',
                  marginTop: 'auto' // Push to bottom
                }}>
                  ✓ All orders loaded ({totalOrders} total)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
};

const OrderDetailsModal = ({ order, onClose, getStatusColor }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: 0, color: '#333' }}>
            Order #{order.order_number}
          </h4>
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

        {/* Order Summary */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <p><strong>Order Date:</strong> {formatDateTime(order.created_at)}</p>
              <p><strong>Status:</strong>{' '}
                <span style={{
                  backgroundColor: getStatusColor(order.status),
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase'
                }}>
                  {order.status}
                </span>
              </p>
            </div>
            <div>
              <p><strong>Total:</strong> ${parseFloat(order.total_amount).toFixed(2)}</p>
              <p><strong>Items:</strong> {order.order_items?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shipping_address && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h5 style={{ color: '#333', marginBottom: '0.5rem' }}>Shipping Address</h5>
            <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px' }}>
              <p style={{ margin: '0 0 0.25rem 0' }}>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && (
                <p style={{ margin: '0 0 0.25rem 0' }}>{order.shipping_address.address_line2}</p>
              )}
              <p style={{ margin: 0 }}>
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
              </p>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div>
          <h5 style={{ color: '#333', marginBottom: '1rem' }}>Order Items</h5>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {order.order_items?.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px'
                }}
              >
                <div>
                  <strong>{item.product?.name || `Product ID: ${item.product_id}`}</strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
                    Quantity: {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                  </p>
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  ${parseFloat(item.total_price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAccount;