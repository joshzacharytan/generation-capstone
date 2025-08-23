import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { formatDateTime } from '../utils/dateUtils';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersPerPage] = useState(15);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Loading states
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    fetchOrders(true);
    fetchOrdersCount();
  }, [statusFilter, searchQuery, dateFilter]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchOrders(false);
    }
  }, [currentPage]);

  const fetchOrders = async (resetOrders = true) => {
    try {
      const loadingState = currentPage === 1 || resetOrders;
      if (loadingState) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
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
      
      const response = await ordersAPI.getAll(Object.fromEntries(params));
      
      if (resetOrders || currentPage === 1) {
        setOrders(response.data);
      } else {
        setOrders(prev => [...prev, ...response.data]);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchOrdersCount = async () => {
    try {
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
      
      const response = await ordersAPI.getCount(Object.fromEntries(params));
      setTotalOrders(response.data.total);
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      await fetchOrders(true); // Refresh orders
      setSelectedOrder(null);
    } catch (err) {
      setError('Failed to update order status');
    }
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

  const getStatusOptions = (currentStatus) => {
    const statusFlow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };
    return statusFlow[currentStatus] || [];
  };

  return (
    <div>
      {/* Header with order count */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Order Management</h2>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
          {totalOrders > 0 ? `${totalOrders} order${totalOrders !== 1 ? 's' : ''} found` : 'No orders found'}
          {statusFilter !== 'all' && ` • Filtered by: ${statusFilter}`}
          {dateFilter !== 'all' && ` • ${getDateFilterLabel(dateFilter)}`}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          color: '#dc3545',
          backgroundColor: '#f8d7da',
          padding: '1rem',
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: '1px solid #dee2e6'
      }}>
        {/* Status Filter Tabs */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All Orders', emoji: '📋' },
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
                <span>{status.emoji}</span>
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
          <form onSubmit={handleSearch} style={{ flex: '1', minWidth: '250px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search by order number, customer name, or email..."
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
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <LoadingSpinner />
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          {statusFilter === 'all' && !searchQuery && dateFilter === 'all' ? (
            <>
              <h3 style={{ color: '#6c757d' }}>No orders yet</h3>
              <p style={{ color: '#6c757d' }}>Orders will appear here when customers make purchases.</p>
            </>
          ) : (
            <>
              <h3 style={{ color: '#6c757d' }}>No orders found</h3>
              <p style={{ color: '#6c757d' }}>Try adjusting your filters or search criteria.</p>
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
        <>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #dee2e6',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s ease'
                }}
                onClick={() => setSelectedOrder(order)}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                      Order #{order.order_number}
                    </h4>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                      Customer: {order.customer?.first_name} {order.customer?.last_name} ({order.customer?.email})
                    </p>
                    <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#28a745',
                      marginBottom: '0.5rem'
                    }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </div>
                    <span style={{
                      fontSize: '0.875rem',
                      backgroundColor: getStatusColor(order.status),
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                  {order.order_items?.length || 0} item(s) • Click to view details
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More Section */}
          {hasMoreOrders() && (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
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
            <div style={{ textAlign: 'center', padding: '1rem', color: '#6c757d', fontSize: '0.85rem' }}>
              ✓ All orders loaded ({totalOrders} total)
            </div>
          )}
        </>
      )}

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={updateOrderStatus}
          getStatusColor={getStatusColor}
          getStatusOptions={getStatusOptions}
        />
      )}
    </div>
  );
};

const OrderDetails = ({ order, onClose, onStatusUpdate, getStatusColor, getStatusOptions }) => {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    await onStatusUpdate(order.id, newStatus);
    setUpdating(false);
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
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#333' }}>
            Order #{order.order_number}
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

        {/* Order Info */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>Customer Information</h4>
              <p><strong>Name:</strong> {order.customer?.first_name} {order.customer?.last_name}</p>
              <p><strong>Email:</strong> {order.customer?.email}</p>
              {order.customer?.phone && <p><strong>Phone:</strong> {order.customer.phone}</p>}
            </div>
            <div>
              <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>Order Details</h4>
              <p><strong>Date:</strong> {formatDateTime(order.created_at)}</p>
              <p><strong>Total:</strong> ${parseFloat(order.total_amount).toFixed(2)}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span style={{
                  backgroundColor: getStatusColor(order.status),
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase'
                }}>
                  {order.status}
                </span>
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>Shipping Address</h4>
              <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px' }}>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#333', marginBottom: '1rem' }}>Order Items</h4>
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
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              >
                <div>
                  <strong>{item.product?.name || `Product ID: ${item.product_id}`}</strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
                    Quantity: {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    ${parseFloat(item.total_price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Update */}
        <div>
          <h4 style={{ color: '#333', marginBottom: '1rem' }}>Update Status</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {getStatusOptions(order.status).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={updating}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: updating ? '#6c757d' : getStatusColor(status),
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  fontSize: '0.875rem'
                }}
              >
                {updating ? 'Updating...' : `Mark as ${status}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersManagement;