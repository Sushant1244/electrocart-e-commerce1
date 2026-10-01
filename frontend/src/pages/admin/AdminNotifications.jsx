import React, { useEffect, useState, useMemo } from 'react';
import API from '../../api/api';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableTypes, setAvailableTypes] = useState([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/notifications/all');
      setNotifications(res.data.notifications || []);
      setAvailableTypes(res.data.types || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(notif => 
        (notif.title || '').toLowerCase().includes(query) ||
        (notif.body || '').toLowerCase().includes(query) ||
        (notif.user?.name || '').toLowerCase().includes(query) ||
        (notif.user?.email || '').toLowerCase().includes(query)
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(notif => notif.meta?.type === typeFilter);
    }
    
    // Read status filter
    if (readFilter !== 'all') {
      const isRead = readFilter === 'read';
      result = result.filter(notif => notif.read === isRead);
    }
    
    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'date-desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        default:
          return 0;
      }
    });
    
    return result;
  }, [notifications, searchQuery, typeFilter, readFilter, sortBy]);

  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      alert('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    if (!confirm('Mark all notifications as read?')) return;
    try {
      await API.post('/notifications/mark-all-read');
      loadNotifications();
      alert('All notifications marked as read');
    } catch (err) {
      alert('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await API.delete(`/notifications/${id}`);
      loadNotifications();
    } catch (err) {
      alert('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'order': '📦',
      'payment': '💳',
      'shipping': '🚚',
      'product': '🛍️',
      'promo': '🏷️',
      'system': '⚙️',
      'default': '🔔'
    };
    return icons[type] || icons.default;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="admin-notifications">
        <div className="admin-header">
          <h2>Notifications Management</h2>
        </div>
        <div className="loading-container">
          <div className="loading">Loading notifications...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-notifications">
        <div className="admin-header">
          <h2>Notifications Management</h2>
        </div>
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button className="btn-primary" onClick={loadNotifications}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-notifications">
      <div className="admin-header">
        <h2>Notifications Management</h2>
        <div className="header-stats">
          <span className="stat-badge">Total: {notifications.length}</span>
          <span className="stat-badge unread">{unreadCount} Unread</span>
          {unreadCount > 0 && (
            <button className="btn-outline" onClick={markAllAsRead}>
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="notifications-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
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
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
        
        {(searchQuery || typeFilter !== 'all' || readFilter !== 'all') && (
          <button 
            className="clear-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('all');
              setReadFilter('all');
            }}
          >
            Clear
          </button>
        )}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <p>No notifications found.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map(notif => (
            <div 
              key={notif._id || notif.id} 
              className={`notification-card ${notif.read ? 'read' : 'unread'}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notif.meta?.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h4 className="notification-title">{notif.title}</h4>
                  <span className={`notification-type badge-${notif.meta?.type || 'default'}`}>
                    {notif.meta?.type || 'General'}
                  </span>
                </div>
                
                <p className="notification-body">{notif.body}</p>
                
                <div className="notification-meta">
                  {notif.user && (
                    <span className="notification-user">
                      👤 {notif.user.name || notif.user.email}
                    </span>
                  )}
                  <span className="notification-date">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                  {notif.read && (
                    <span className="notification-read-status read">✓ Read</span>
                  )}
                  {!notif.read && (
                    <span className="notification-read-status unread">• Unread</span>
                  )}
                </div>
              </div>
              
              <div className="notification-actions">
                {!notif.read && (
                  <button 
                    className="btn-icon" 
                    onClick={() => markAsRead(notif._id || notif.id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button 
                  className="btn-icon danger" 
                  onClick={() => deleteNotification(notif._id || notif.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
