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

  useEffect(() => {
    if (customer) {
      fetchOrders();
    }
  }, [customer]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem(`customer_token_${tenantDomain}`);
      
      const response = await fetch(`http://localhost:8000/store/${tenantDomain}/customer/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (err) {
      setError('Failed to load order history');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
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
            My Account - Order History
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

        {/* Customer Info */}
        <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
          <p style={{ margin: 0, color: '#333' }}>
            <strong>{customer.first_name} {customer.last_name}</strong> • {customer.email}
          </p>
        </div>

        {/* Orders List */}
        <div style={{ flex: 1, overflow: 'auto', padding: loading || orders.length === 0 ? '2rem' : '0' }}>
          {loading ? (
            <div style={{ textAlign: 'center' }}>
              <LoadingSpinner />
              <p>Loading your orders...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#dc3545' }}>
              <p>{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6c757d' }}>
              <h4>No orders yet</h4>
              <p>Your order history will appear here after you make your first purchase.</p>
            </div>
          ) : (
            <div>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #f8f9fa',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedOrder(order)}
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