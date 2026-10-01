import React, { useEffect, useState, useMemo } from 'react';
import API from '../../api/api';
import { Link, useLocation } from 'react-router-dom';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const location = useLocation();
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => {
        const customerName = order.customer || order.customerName || order.user?.name || '';
        const email = order.email || order.emailAddress || order.user?.email || '';
        const orderId = String(order.id || order._id || '');
        
        return customerName.toLowerCase().includes(query) ||
               email.toLowerCase().includes(query) ||
               orderId.toLowerCase().includes(query);
      });
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => 
        (order.status || 'pending').toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt || order.date || 0);
        return orderDate >= startDate;
      });
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt || order.date || 0);
        return orderDate <= endDate;
      });
    }
    
    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0);
        case 'date-desc':
          return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
        case 'total-asc':
          return (a.total || a.totalPrice || 0) - (b.total || b.totalPrice || 0);
        case 'total-desc':
          return (b.total || b.totalPrice || 0) - (a.total || a.totalPrice || 0);
        case 'status-asc':
          return (a.status || '').localeCompare(b.status || '');
        case 'status-desc':
          return (b.status || '').localeCompare(a.status || '');
        default:
          return 0;
      }
    });
    
    return result;
  }, [orders, searchQuery, statusFilter, sortBy, dateRange]);

  // Get unique statuses for filter dropdown
  const availableStatuses = useMemo(() => {
    const statuses = new Set(orders.map(o => o.status).filter(Boolean));
    return ['all', ...Array.from(statuses)];
  }, [orders]);

  // If navigation included openOrderId in state, open that order once orders are loaded
  useEffect(() => {
    const openId = location?.state?.openOrderId;
    if (!openId) return;
    if (orders && orders.length) {
      const found = orders.find(o => String(o._id || o.id) === String(openId));
      if (found) setSelectedOrder(found);
      // clear history state to avoid reopening on refresh/back
      try { window.history.replaceState({}, document.title); } catch (e) {}
    }
  }, [location, orders]);

  const updateOrderStatus = async (orderId, status, deliveryStatus, trackingNumber) => {
    try {
      await API.patch(`/orders/${orderId}`, {
        status,
        deliveryStatus,
        trackingNumber,
        note: `Status updated to ${deliveryStatus || status}`,
        location: 'Warehouse'
      });
      loadOrders();
      setSelectedOrder(null);
      alert('Order status updated');
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    const num = Number(value || 0);
    return num.toLocaleString('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 });
  };

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="admin-header">
          <h2>Order Management & Delivery Tracking</h2>
        </div>
        <div className="loading-container">
          <div className="loading">Loading orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-orders">
        <div className="admin-header">
          <h2>Order Management & Delivery Tracking</h2>
        </div>
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button className="btn-primary" onClick={loadOrders}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="admin-header">
        <h2>Order Management & Delivery Tracking</h2>
        <div className="header-stats">
          <span className="stat-badge">Total: {orders.length}</span>
          <span className="stat-badge">Filtered: {filteredOrders.length}</span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="orders-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by order ID, customer, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            {availableStatuses.filter(s => s !== 'all').map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="total-desc">Highest Total</option>
            <option value="total-asc">Lowest Total</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="status-desc">Status (Z-A)</option>
          </select>
        </div>
        
        <div className="filter-group date-filters">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="date-input"
            placeholder="Start Date"
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="date-input"
            placeholder="End Date"
          />
        </div>
        
        {(searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end) && (
          <button 
            className="clear-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setDateRange({ start: '', end: '' });
              setSortBy('date-desc');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <p>No orders found matching your criteria.</p>
          {(searchQuery || statusFilter !== 'all' || dateRange.start || dateRange.end) && (
            <button 
              className="btn-outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateRange({ start: '', end: '' });
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table full">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const itemCount = Array.isArray(order.items) ? order.items.length : 
                                  Array.isArray(order.orderItems) ? order.orderItems.length : 0;
                return (
                  <tr key={order._id || order.id}>
                    <td className="order-id-cell">
                      {String(order.id || order._id || '').startsWith('ORD-') 
                        ? String(order.id || order._id) 
                        : `ORD-${String(order.id || order._id || '').slice(-4)}`}
                    </td>
                    <td className="customer-cell">
                      {order.customer || order.customerName || order.user?.name || 'N/A'}
                    </td>
                    <td>{order.email || order.emailAddress || order.user?.email || ''}</td>
                    <td className="items-count">{itemCount} item{itemCount !== 1 ? 's' : ''}</td>
                    <td className="total-cell">{formatCurrency(order.total ?? order.totalPrice ?? 0)}</td>
                    <td>
                      <span className={`status-badge status-${order.status || 'pending'}`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td className="date-cell">
                      {(() => {
                        const d = order.createdAt || order.created_at || order.date || order.purchasedAt || null;
                        try { 
                          return d ? new Date(d).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : ''; 
                        } catch (e) { return ''; }
                      })()}
                    </td>
                    <td>
                      <button className="link" onClick={() => setSelectedOrder(order)}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content order-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            
            <div className="order-details-content">
              <div className="detail-section">
                <h4>Order Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Order ID:</label>
                    <span>{selectedOrder.id || selectedOrder._id}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge status-${selectedOrder.status || 'pending'}`}>
                      {selectedOrder.status || 'pending'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Date:</label>
                    <span>{new Date(selectedOrder.createdAt || selectedOrder.date || '').toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Total:</label>
                    <span className="total-value">{formatCurrency(selectedOrder.total ?? selectedOrder.totalPrice ?? 0)}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Customer Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>{selectedOrder.customer || selectedOrder.customerName || selectedOrder.user?.name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedOrder.email || selectedOrder.emailAddress || selectedOrder.user?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {selectedOrder.shippingAddress && (
                <div className="detail-section">
                  <h4>Shipping Address</h4>
                  <div className="address-box">
                    <p>{selectedOrder.shippingAddress.fullName || selectedOrder.shippingAddress.name}</p>
                    <p>{selectedOrder.shippingAddress.line1 || selectedOrder.shippingAddress.address}</p>
                    {selectedOrder.shippingAddress.line2 && <p>{selectedOrder.shippingAddress.line2}</p>}
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              )}
              
              <div className="detail-section">
                <h4>Order Items</h4>
                <div className="items-list">
                  {(selectedOrder.items || selectedOrder.orderItems || []).map((item, idx) => (
                    <div key={item._id || item.id || idx} className="order-item">
                      <div className="item-name">{item.product?.name || item.name || 'Product'}</div>
                      <div className="item-qty">Qty: {item.quantity || 1}</div>
                      <div className="item-price">{formatCurrency(item.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Update Status</h4>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  updateOrderStatus(
                    selectedOrder._id,
                    formData.get('status'),
                    formData.get('deliveryStatus'),
                    formData.get('trackingNumber')
                  );
                }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Order Status</label>
                      <select name="status" defaultValue={selectedOrder.status}>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Delivery Status</label>
                      <select name="deliveryStatus" defaultValue={selectedOrder.deliveryStatus || 'pending'}>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Tracking Number</label>
                    <input 
                      type="text" 
                      name="trackingNumber" 
                      placeholder="Enter tracking number"
                      defaultValue={selectedOrder.trackingNumber || ''}
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Update Status</button>
                    <button type="button" onClick={() => setSelectedOrder(null)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
