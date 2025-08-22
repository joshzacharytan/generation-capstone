import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { formatDateTime } from '../utils/dateUtils';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      setOrders(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      await fetchOrders(); // Refresh orders
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <LoadingSpinner />
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        color: '#dc3545',
        backgroundColor: '#f8d7da',
        padding: '1rem',
        borderRadius: '4px',
        border: '1px solid #f5c6cb'
      }}>
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ color: '#6c757d' }}>No orders yet</h3>
        <p style={{ color: '#6c757d' }}>Orders will appear here when customers make purchases.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#333', marginBottom: '1rem' }}>
          Order Management ({orders.length} orders)
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #dee2e6',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedOrder(order)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                    Order #{order.order_number}
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                    Customer: {order.customer?.first_name} {order.customer?.last_name}
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
      </div>

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