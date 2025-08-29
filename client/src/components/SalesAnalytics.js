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
      pending: 'var(--color-warning)',
      confirmed: 'var(--color-success)',
      processing: 'var(--color-primary)',
      shipped: 'var(--color-info)',
      delivered: 'var(--color-success)',
      cancelled: 'var(--color-danger)'
    };
    return colors[status] || 'var(--text-secondary)';
  };

  const renderLineChart = () => {
    if (!revenueTrend || revenueTrend.length === 0) {
      return <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No revenue data available</p>;;
    }

    const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue));
    const maxOrders = Math.max(...revenueTrend.map(d => d.order_count));
    
    return (
      <div style={{ position: 'relative', height: '300px', padding: '1rem', color: 'var(--text-primary)' }}>
        <svg width="100%" height="100%" viewBox="0 0 600 250">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line 
              key={`grid-${i}`}
              x1="50" 
              y1={50 + i * 40} 
              x2="550" 
              y2={50 + i * 40}
              stroke="var(--border-primary)" 
              strokeWidth="1"
            />
          ))}
          
          {/* Revenue line */}
          <polyline
            fill="none"
            stroke="var(--color-success)"
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
            stroke="var(--color-primary)"
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
                <circle cx={x} cy={revenueY} r="4" fill="var(--color-success)" />
                <circle cx={x} cy={orderY} r="3" fill="var(--color-primary)" />
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
                  fill="var(--text-secondary)"
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
              fill="var(--text-secondary)"
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
          backgroundColor: 'var(--bg-overlay)',
          padding: '0.5rem',
          borderRadius: '4px',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: 'var(--color-success)', marginRight: '0.5rem' }}></div>
            <span style={{ fontSize: '0.8rem' }}>Revenue</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '20px', 
              height: '2px', 
              backgroundColor: 'var(--color-primary)', 
              marginRight: '0.5rem',
              backgroundImage: 'repeating-linear-gradient(to right, var(--color-primary) 0, var(--color-primary) 5px, transparent 5px, transparent 10px)'
            }}></div>
            <span style={{ fontSize: '0.8rem' }}>Orders</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-primary)' }}>
        <LoadingSpinner />
        <p style={{ color: 'var(--text-primary)' }}>Loading sales analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderRadius: '4px',
        color: 'var(--text-primary)'
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
            backgroundColor: 'var(--color-danger)',
            color: 'var(--text-inverse)',
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
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📊 Sales Analytics</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid var(--input-border)',
              fontSize: '1rem',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)'
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
              border: '1px solid var(--input-border)',
              fontSize: '1rem',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)'
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
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>💰</span>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Total Revenue</h4>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: 'var(--color-success)' }}>
            {formatCurrency(analyticsData?.total_revenue || 0)}
          </p>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            color: analyticsData?.revenue_growth_percentage >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
          }}>
            {analyticsData?.revenue_growth_percentage >= 0 ? '↗️' : '↘️'} 
            {Math.abs(analyticsData?.revenue_growth_percentage || 0).toFixed(1)}% vs previous period
          </p>
        </div>

        {/* Total Orders */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📦</span>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Total Orders</h4>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: 'var(--color-primary)' }}>
            {analyticsData?.total_orders || 0}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            orders in selected period
          </p>
        </div>

        {/* Average Order Value */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🛒</span>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Avg Order Value</h4>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: 'var(--color-info)' }}>
            {formatCurrency(analyticsData?.average_order_value || 0)}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            per order average
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Revenue Trend Chart */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>📈 Revenue & Orders Trend</h3>
          {renderLineChart()}
        </div>

        {/* Order Status Distribution */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>📋 Order Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analyticsData?.status_distribution?.map(status => (
              <div key={status.status} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-secondary)',
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
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {status.count} orders
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {formatCurrency(status.total_value)}
                  </div>
                </div>
              </div>
            )) || <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No status data available</p>}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-primary)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>🏆 Top Performing Products</h3>
        {topProducts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'left', 
                    borderBottom: '2px solid var(--border-primary)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => handleSort('product_name')}
                  >
                    Product {getSortIcon('product_name')}
                  </th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right', 
                    borderBottom: '2px solid var(--border-primary)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => handleSort('total_revenue')}
                  >
                    Revenue {getSortIcon('total_revenue')}
                  </th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right', 
                    borderBottom: '2px solid var(--border-primary)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => handleSort('total_quantity')}
                  >
                    Quantity Sold {getSortIcon('total_quantity')}
                  </th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right', 
                    borderBottom: '2px solid var(--border-primary)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => handleSort('order_count')}
                  >
                    Orders {getSortIcon('order_count')}
                  </th>
                  <th style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right', 
                    borderBottom: '2px solid var(--border-primary)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: 'var(--text-primary)'
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
                    backgroundColor: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'
                  }}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--text-inverse)',
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
                      borderBottom: '1px solid var(--border-primary)',
                      fontWeight: 'bold',
                      color: 'var(--color-success)'
                    }}>
                      {formatCurrency(product.total_revenue)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border-primary)' }}>
                      {product.total_quantity}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border-primary)' }}>
                      {product.order_count}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid var(--border-primary)' }}>
                      {formatCurrency(product.average_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
            No product sales data available for the selected period
          </p>
        )}
      </div>
    </div>
  );
};

export default SalesAnalytics;