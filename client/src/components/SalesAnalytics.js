import React, { useState, useEffect } from 'react';
import { ordersAPI, categoriesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const SalesAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [sortField, setSortField] = useState('total_revenue');
  const [sortDirection, setSortDirection] = useState('desc');

  const periodOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' },
    { value: 365, label: 'Last year' }
  ];

  const fetchAnalyticsData = async (days = 30, categoryId = null) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching analytics with:', { days, categoryId });

      // Fetch overview data
      const overviewResponse = await ordersAPI.getAnalyticsOverview(days, categoryId);
      const overview = overviewResponse.data;
      console.log('Overview data:', overview);

      // Fetch revenue trend
      const trendResponse = await ordersAPI.getRevenueTrend(days, categoryId);
      const trend = trendResponse.data;
      console.log('Trend data:', trend);

      // Fetch top products
      const productsResponse = await ordersAPI.getTopProducts(days, 10, categoryId);
      const products = productsResponse.data;
      console.log('Products data:', products);

      setAnalyticsData(overview);
      setRevenueTrend(trend);
      setTopProducts(products);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(`Failed to load analytics: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const categoryId = selectedCategory === 'all' ? null : selectedCategory;
    fetchAnalyticsData(selectedPeriod, categoryId);
  }, [selectedPeriod, selectedCategory]);

  const handlePeriodChange = (e) => {
    setSelectedPeriod(parseInt(e.target.value));
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedProducts = () => {
    if (!topProducts || topProducts.length === 0) return [];
    
    return [...topProducts].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle string comparison for product names
      if (sortField === 'product_name') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return '↕️'; // Neutral sort icon
    }
    return sortDirection === 'asc' ? '↗️' : '↘️';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#28a745',
      processing: '#007bff',
      shipped: '#17a2b8',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const renderLineChart = () => {
    if (!revenueTrend || revenueTrend.length === 0) {
      return <p style={{ textAlign: 'center', color: '#6c757d' }}>No revenue data available</p>;
    }

    const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue));
    const maxOrders = Math.max(...revenueTrend.map(d => d.order_count));
    
    return (
      <div style={{ position: 'relative', height: '300px', padding: '1rem' }}>
        <svg width="100%" height="100%" viewBox="0 0 600 250">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line 
              key={`grid-${i}`}
              x1="50" 
              y1={50 + i * 40} 
              x2="550" 
              y2={50 + i * 40}
              stroke="#e9ecef" 
              strokeWidth="1"
            />
          ))}
          
          {/* Revenue line */}
          <polyline
            fill="none"
            stroke="#28a745"
            strokeWidth="3"
            points={revenueTrend.map((point, index) => {
              const x = 50 + (index * (500 / (revenueTrend.length - 1 || 1)));
              const y = 210 - (point.revenue / maxRevenue * 160);
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Order count line */}
          <polyline
            fill="none"
            stroke="#007bff"
            strokeWidth="2"
            strokeDasharray="5,5"
            points={revenueTrend.map((point, index) => {
              const x = 50 + (index * (500 / (revenueTrend.length - 1 || 1)));
              const y = 210 - (point.order_count / maxOrders * 160);
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {revenueTrend.map((point, index) => {
            const x = 50 + (index * (500 / (revenueTrend.length - 1 || 1)));
            const revenueY = 210 - (point.revenue / maxRevenue * 160);
            const orderY = 210 - (point.order_count / maxOrders * 160);
            
            return (
              <g key={index}>
                <circle cx={x} cy={revenueY} r="4" fill="#28a745" />
                <circle cx={x} cy={orderY} r="3" fill="#007bff" />
              </g>
            );
          })}
          
          {/* X-axis labels */}
          {revenueTrend.map((point, index) => {
            if (index % Math.ceil(revenueTrend.length / 6) === 0) {
              const x = 50 + (index * (500 / (revenueTrend.length - 1 || 1)));
              return (
                <text 
                  key={`label-${index}`}
                  x={x} 
                  y="235" 
                  textAnchor="middle" 
                  fontSize="10" 
                  fill="#6c757d"
                >
                  {formatDate(point.date)}
                </text>
              );
            }
            return null;
          })}
          
          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map(i => (
            <text 
              key={`y-label-${i}`}
              x="45" 
              y={215 - i * 40} 
              textAnchor="end" 
              fontSize="10" 
              fill="#6c757d"
            >
              ${Math.round(maxRevenue * (i / 4) / 1000)}k
            </text>
          ))}
        </svg>
        
        {/* Legend */}
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          right: '1rem',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '0.5rem',
          borderRadius: '4px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#28a745', marginRight: '0.5rem' }}></div>
            <span style={{ fontSize: '0.8rem' }}>Revenue</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '20px', 
              height: '2px', 
              backgroundColor: '#007bff', 
              marginRight: '0.5rem',
              backgroundImage: 'repeating-linear-gradient(to right, #007bff 0, #007bff 5px, transparent 5px, transparent 10px)'
            }}></div>
            <span style={{ fontSize: '0.8rem' }}>Orders</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <LoadingSpinner />
        <p>Loading sales analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        color: '#721c24'
      }}>
        <h3>Error Loading Analytics</h3>
        <p>{error}</p>
        <button
          onClick={() => {
            const categoryId = selectedCategory === 'all' ? null : selectedCategory;
            fetchAnalyticsData(selectedPeriod, categoryId);
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with Period Selection */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{ margin: 0 }}>📊 Sales Analytics</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem'
            }}
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Total Revenue */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>💰</span>
            <h4 style={{ margin: 0, color: '#6c757d' }}>Total Revenue</h4>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#28a745' }}>
            {formatCurrency(analyticsData?.total_revenue || 0)}
          </p>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            color: analyticsData?.revenue_growth_percentage >= 0 ? '#28a745' : '#dc3545'
          }}>
            {analyticsData?.revenue_growth_percentage >= 0 ? '↗️' : '↘️'} 
            {Math.abs(analyticsData?.revenue_growth_percentage || 0).toFixed(1)}% vs previous period
          </p>
        </div>

        {/* Total Orders */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📦</span>
            <h4 style={{ margin: 0, color: '#6c757d' }}>Total Orders</h4>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#007bff' }}>
            {analyticsData?.total_orders || 0}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
            orders in selected period
          </p>
        </div>

        {/* Average Order Value */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🛒</span>
            <h4 style={{ margin: 0, color: '#6c757d' }}>Avg Order Value</h4>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#17a2b8' }}>
            {formatCurrency(analyticsData?.average_order_value || 0)}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
            per order average
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Revenue Trend Chart */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>📈 Revenue & Orders Trend</h3>
          {renderLineChart()}
        </div>

        {/* Order Status Distribution */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>📋 Order Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analyticsData?.status_distribution?.map(status => (
              <div key={status.status} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                borderLeft: `4px solid ${getStatusColor(status.status)}`
              }}>
                <div>
                  <span style={{
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                    color: getStatusColor(status.status)
                  }}>
                    {status.status}
                  </span>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    {status.count} orders
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {formatCurrency(status.total_value)}
                  </div>
                </div>
              </div>
            )) || <p style={{ textAlign: 'center', color: '#6c757d' }}>No status data available</p>}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>🏆 Top Performing Products</h3>
        {topProducts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('product_name')}
                  >
                    Product {getSortIcon('product_name')}
                  </th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right', 
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('total_revenue')}
                  >
                    Revenue {getSortIcon('total_revenue')}
                  </th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right', 
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('total_quantity')}
                  >
                    Quantity Sold {getSortIcon('total_quantity')}
                  </th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right', 
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('order_count')}
                  >
                    Orders {getSortIcon('order_count')}
                  </th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right', 
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('average_price')}
                  >
                    Avg Price {getSortIcon('average_price')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSortedProducts().map((product, index) => (
                  <tr key={product.product_id} style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                  }}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #dee2e6' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          marginRight: '0.5rem'
                        }}>
                          {index + 1}
                        </span>
                        {product.product_name}
                      </div>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'right',
                      borderBottom: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      color: '#28a745'
                    }}>
                      {formatCurrency(product.total_revenue)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                      {product.total_quantity}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                      {product.order_count}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                      {formatCurrency(product.average_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
            No product sales data available for the selected period
          </p>
        )}
      </div>
    </div>
  );
};

export default SalesAnalytics;