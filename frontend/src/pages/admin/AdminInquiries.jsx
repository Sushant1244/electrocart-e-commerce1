import React, { useEffect, useState, useMemo } from 'react';
import API from '../../api/api';

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/inquiries');
      setInquiries(res.data.inquiries || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort inquiries
  const filteredInquiries = useMemo(() => {
    let result = [...inquiries];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inquiry => 
        (inquiry.name || '').toLowerCase().includes(query) ||
        (inquiry.email || '').toLowerCase().includes(query) ||
        (inquiry.message || '').toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(inquiry => (inquiry.status || 'new') === statusFilter);
    }
    
    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'date-desc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        default:
          return 0;
      }
    });
    
    return result;
  }, [inquiries, searchQuery, statusFilter, sortBy]);

  const updateStatus = async (id, newStatus) => {
    try {
      await API.patch(`/inquiries/${id}`, { status: newStatus });
      setInquiries(prev => prev.map(inq => 
        inq.id === id ? { ...inq, status: newStatus, updatedAt: Date.now() } : inq
      ));
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const deleteInquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await API.delete(`/inquiries/${id}`);
      setInquiries(prev => prev.filter(inq => inq.id !== id));
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete inquiry');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { class: 'status-new', label: 'New' },
      read: { class: 'status-read', label: 'Read' },
      replied: { class: 'status-replied', label: 'Replied' },
      archived: { class: 'status-archived', label: 'Archived' }
    };
    const config = statusConfig[status] || statusConfig.new;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  // Stats
  const stats = useMemo(() => ({
    total: inquiries.length,
    new: inquiries.filter(i => (i.status || 'new') === 'new').length,
    read: inquiries.filter(i => (i.status || 'new') === 'read').length,
    replied: inquiries.filter(i => (i.status || 'new') === 'replied').length,
    archived: inquiries.filter(i => (i.status || 'new') === 'archived').length
  }), [inquiries]);

  if (loading) {
    return (
      <div className="admin-inquiries">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-inquiries">
      <div className="page-header">
        <h1>Inquiries Management</h1>
        <button className="btn-refresh" onClick={loadInquiries}>Refresh</button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Inquiries</div>
        </div>
        <div className="stat-card stat-new">
          <div className="stat-value">{stats.new}</div>
          <div className="stat-label">New</div>
        </div>
        <div className="stat-card stat-read">
          <div className="stat-value">{stats.read}</div>
          <div className="stat-label">Read</div>
        </div>
        <div className="stat-card stat-replied">
          <div className="stat-value">{stats.replied}</div>
          <div className="stat-label">Replied</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Sort:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
        </div>
      </div>

      {/* Main Content - List and Detail */}
      <div className="inquiries-container">
        {/* Inquiries List */}
        <div className="inquiries-list">
          {filteredInquiries.length === 0 ? (
            <div className="empty-state">
              <p>No inquiries found</p>
            </div>
          ) : (
            filteredInquiries.map(inquiry => (
              <div
                key={inquiry.id}
                className={`inquiry-card ${selectedInquiry?.id === inquiry.id ? 'selected' : ''} ${(inquiry.status || 'new') === 'new' ? 'unread' : ''}`}
                onClick={() => setSelectedInquiry(inquiry)}
              >
                <div className="inquiry-header">
                  <span className="inquiry-name">{inquiry.name}</span>
                  {getStatusBadge(inquiry.status)}
                </div>
                <div className="inquiry-email">{inquiry.email}</div>
                <div className="inquiry-preview">{inquiry.message?.substring(0, 80)}...</div>
                <div className="inquiry-date">{formatDate(inquiry.createdAt)}</div>
              </div>
            ))
          )}
        </div>

        {/* Inquiry Detail */}
        <div className="inquiry-detail">
          {selectedInquiry ? (
            <>
              <div className="detail-header">
                <h2>Inquiry Details</h2>
                <div className="detail-actions">
                  <select
                    value={selectedInquiry.status || 'new'}
                    onChange={(e) => updateStatus(selectedInquiry.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button
                    className="btn-delete"
                    onClick={() => deleteInquiry(selectedInquiry.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="detail-content">
                <div className="detail-field">
                  <label>Name:</label>
                  <span>{selectedInquiry.name}</span>
                </div>
                <div className="detail-field">
                  <label>Email:</label>
                  <a href={`mailto:${selectedInquiry.email}`}>{selectedInquiry.email}</a>
                </div>
                <div className="detail-field">
                  <label>Status:</label>
                  {getStatusBadge(selectedInquiry.status)}
                </div>
                <div className="detail-field">
                  <label>Received:</label>
                  <span>{formatDate(selectedInquiry.createdAt)}</span>
                </div>
                <div className="detail-field">
                  <label>Message:</label>
                  <div className="message-content">{selectedInquiry.message}</div>
                </div>
              </div>
              
              <div className="detail-footer">
                <a href={`mailto:${selectedInquiry.email}`} className="btn-reply">
                  Reply via Email
                </a>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select an inquiry to view details</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-inquiries {
          padding: 20px;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .page-header h1 {
          font-size: 24px;
          color: #333;
          margin: 0;
        }
        
        .btn-refresh {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-refresh:hover {
          background: #0056b3;
        }
        
        .error-message {
          padding: 12px;
          background: #f8d7da;
          color: #721c24;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #333;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        
        .stat-new .stat-value { color: #dc3545; }
        .stat-read .stat-value { color: #ffc107; }
        .stat-replied .stat-value { color: #28a745; }
        
        .filters-bar {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .search-box input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 280px;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .filter-group label {
          font-size: 14px;
          color: #666;
        }
        
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .inquiries-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          height: calc(100vh - 350px);
          min-height: 400px;
        }
        
        .inquiries-list {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow-y: auto;
        }
        
        .inquiry-card {
          padding: 15px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .inquiry-card:hover {
          background: #f8f9fa;
        }
        
        .inquiry-card.selected {
          background: #e7f3ff;
          border-left: 3px solid #007bff;
        }
        
        .inquiry-card.unread {
          background: #fff8f0;
        }
        
        .inquiry-card.unread.selected {
          background: #e7f3ff;
        }
        
        .inquiry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        
        .inquiry-name {
          font-weight: 600;
          color: #333;
        }
        
        .status-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-new { background: #dc3545; color: white; }
        .status-read { background: #ffc107; color: #333; }
        .status-replied { background: #28a745; color: white; }
        .status-archived { background: #6c757d; color: white; }
        
        .inquiry-email {
          font-size: 13px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .inquiry-preview {
          font-size: 13px;
          color: #888;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .inquiry-date {
          font-size: 12px;
          color: #999;
          margin-top: 5px;
        }
        
        .inquiry-detail {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
        
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        
        .detail-header h2 {
          font-size: 18px;
          margin: 0;
          color: #333;
        }
        
        .detail-actions {
          display: flex;
          gap: 10px;
        }
        
        .status-select {
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .btn-delete {
          padding: 6px 12px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-delete:hover {
          background: #c82333;
        }
        
        .detail-content {
          flex: 1;
          overflow-y: auto;
        }
        
        .detail-field {
          margin-bottom: 15px;
        }
        
        .detail-field label {
          display: block;
          font-size: 12px;
          color: #888;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        
        .detail-field span, .detail-field a {
          font-size: 14px;
          color: #333;
        }
        
        .detail-field a {
          color: #007bff;
          text-decoration: none;
        }
        
        .message-content {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 4px;
          white-space: pre-wrap;
          line-height: 1.5;
        }
        
        .detail-footer {
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        
        .btn-reply {
          display: inline-block;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          text-align: center;
        }
        
        .btn-reply:hover {
          background: #0056b3;
        }
        
        .no-selection {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #888;
        }
        
        .empty-state {
          padding: 40px;
          text-align: center;
          color: #888;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .inquiries-container {
            grid-template-columns: 1fr;
          }
          
          .filters-bar {
            flex-direction: column;
          }
          
          .search-box input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
