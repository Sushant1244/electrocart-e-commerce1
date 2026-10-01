import React, { useEffect, useState, useMemo } from 'react';
import API from '../../api/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [page, roleFilter, verifiedFilter]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(verifiedFilter !== 'all' && { verified: verifiedFilter })
      });
      const res = await API.get(`/users?${params}`);
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await API.get('/users/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const searchUsers = () => {
    setPage(1);
    loadUsers();
  };

  const updateUser = async (id, updates) => {
    try {
      await API.patch(`/users/${id}`, updates);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser(prev => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update user');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser(null);
      }
      loadStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && users.length === 0) {
    return (
      <div className="admin-users">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn-refresh" onClick={() => { loadUsers(); loadStats(); }}>Refresh</button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card stat-admin">
            <div className="stat-value">{stats.adminUsers}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card stat-verified">
            <div className="stat-value">{stats.verifiedUsers}</div>
            <div className="stat-label">Verified</div>
          </div>
          <div className="stat-card stat-new">
            <div className="stat-value">{stats.newUsers}</div>
            <div className="stat-label">New (30 days)</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
          />
          <button className="btn-search" onClick={searchUsers}>Search</button>
        </div>
        
        <div className="filter-group">
          <label>Role:</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Status:</label>
          <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </div>

      {/* Main Content - List and Detail */}
      <div className="users-container">
        {/* Users List */}
        <div className="users-list">
          {users.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                className={`user-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="user-header">
                  <span className="user-name">{user.name || 'No Name'}</span>
                  <span className={`badge ${user.isAdmin ? 'badge-admin' : 'badge-user'}`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                <div className="user-email">{user.email}</div>
                <div className="user-meta">
                  <span className={`status ${user.emailVerified ? 'verified' : 'unverified'}`}>
                    {user.emailVerified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                  <span className="date">Joined: {formatDate(user.createdAt)}</span>
                </div>
              </div>
            ))
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* User Detail */}
        <div className="user-detail">
          {selectedUser ? (
            <>
              <div className="detail-header">
                <h2>User Details</h2>
                <div className="detail-actions">
                  <button
                    className="btn-toggle-admin"
                    onClick={() => updateUser(selectedUser.id, { isAdmin: !selectedUser.isAdmin })}
                  >
                    {selectedUser.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => deleteUser(selectedUser.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="detail-content">
                <div className="detail-field">
                  <label>Name:</label>
                  <span>{selectedUser.name || 'No Name'}</span>
                </div>
                <div className="detail-field">
                  <label>Email:</label>
                  <a href={`mailto:${selectedUser.email}`}>{selectedUser.email}</a>
                </div>
                <div className="detail-field">
                  <label>Role:</label>
                  <span className={`badge ${selectedUser.isAdmin ? 'badge-admin' : 'badge-user'}`}>
                    {selectedUser.isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                <div className="detail-field">
                  <label>Email Status:</label>
                  <span className={`status ${selectedUser.emailVerified ? 'verified' : 'unverified'}`}>
                    {selectedUser.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="detail-field">
                  <label>Joined:</label>
                  <span>{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="detail-field">
                  <label>Last Updated:</label>
                  <span>{formatDate(selectedUser.updatedAt)}</span>
                </div>
              </div>
              
              <div className="detail-footer">
                <a href={`mailto:${selectedUser.email}`} className="btn-contact">
                  Contact User
                </a>
                <button 
                  className="btn-verify"
                  onClick={() => updateUser(selectedUser.id, { emailVerified: !selectedUser.emailVerified })}
                >
                  {selectedUser.emailVerified ? 'Unverify Email' : 'Verify Email'}
                </button>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a user to view details</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-users {
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
        
        .stat-admin .stat-value { color: #6f42c1; }
        .stat-verified .stat-value { color: #28a745; }
        .stat-new .stat-value { color: #17a2b8; }
        
        .filters-bar {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .search-box {
          display: flex;
          gap: 8px;
        }
        
        .search-box input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 250px;
        }
        
        .btn-search {
          padding: 8px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
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
        
        .users-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          height: calc(100vh - 400px);
          min-height: 400px;
        }
        
        .users-list {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow-y: auto;
        }
        
        .user-card {
          padding: 15px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .user-card:hover {
          background: #f8f9fa;
        }
        
        .user-card.selected {
          background: #e7f3ff;
          border-left: 3px solid #007bff;
        }
        
        .user-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        
        .user-name {
          font-weight: 600;
          color: #333;
        }
        
        .badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .badge-admin { background: #6f42c1; color: white; }
        .badge-user { background: #6c757d; color: white; }
        
        .user-email {
          font-size: 13px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .user-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #999;
        }
        
        .status.verified { color: #28a745; }
        .status.unverified { color: #dc3545; }
        
        .user-detail {
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
        
        .btn-toggle-admin {
          padding: 6px 12px;
          background: #6f42c1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-delete {
          padding: 6px 12px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
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
        
        .detail-footer {
          padding-top: 15px;
          border-top: 1px solid #eee;
          display: flex;
          gap: 10px;
        }
        
        .btn-contact {
          flex: 1;
          display: inline-block;
          padding: 10px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          text-align: center;
        }
        
        .btn-contact:hover {
          background: #0056b3;
        }
        
        .btn-verify {
          padding: 10px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
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
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border-top: 1px solid #eee;
        }
        
        .pagination button {
          padding: 6px 12px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .pagination button:disabled {
          background: #ccc;
          cursor: not-allowed;
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
          .users-container {
            grid-template-columns: 1fr;
          }
          
          .filters-bar {
            flex-direction: column;
          }
          
          .search-box {
            width: 100%;
          }
          
          .search-box input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
