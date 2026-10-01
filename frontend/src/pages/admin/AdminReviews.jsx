import React, { useEffect, useState, useMemo } from 'react';
import API from '../../api/api';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search and filter states
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [page, ratingFilter, sortBy]);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(ratingFilter !== 'all' && { rating: ratingFilter }),
        sortBy
      });
      const res = await API.get(`/reviews?${params}`);
      setReviews(res.data.reviews || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await API.get('/reviews/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await API.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      if (selectedReview && selectedReview.id === id) {
        setSelectedReview(null);
      }
      loadStats();
    } catch (err) {
      console.error(err);
      alert('Failed to delete review');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="admin-reviews">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-reviews">
      <div className="page-header">
        <h1>Reviews Management</h1>
        <button className="btn-refresh" onClick={() => { loadReviews(); loadStats(); }}>Refresh</button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalReviews}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="stat-card stat-rating">
            <div className="stat-value">{stats.avgRating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.productsWithReviews}</div>
            <div className="stat-label">Products Reviewed</div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <div className="rating-distribution">
          <h3>Rating Distribution</h3>
          <div className="distribution-bars">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="distribution-bar">
                <span className="stars">{renderStars(rating)}</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: stats.totalReviews > 0 
                        ? `${(stats.ratingDistribution[rating] / stats.totalReviews) * 100}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
                <span className="count">{stats.ratingDistribution[rating] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Rating:</label>
          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Sort:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="rating-desc">Highest Rated</option>
            <option value="rating-asc">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Main Content - List and Detail */}
      <div className="reviews-container">
        {/* Reviews List */}
        <div className="reviews-list">
          {reviews.length === 0 ? (
            <div className="empty-state">
              <p>No reviews found</p>
            </div>
          ) : (
            reviews.map(review => (
              <div
                key={review.id}
                className={`review-card ${selectedReview?.id === review.id ? 'selected' : ''}`}
                onClick={() => setSelectedReview(review)}
              >
                <div className="review-header">
                  <span className="review-stars">{renderStars(review.rating)}</span>
                  <span className="review-product">{review.product?.name || `Product #${review.productId}`}</span>
                </div>
                <div className="review-comment">
                  {review.comment?.substring(0, 100)}
                  {review.comment?.length > 100 ? '...' : ''}
                </div>
                <div className="review-meta">
                  <span className="review-user">By: {review.user?.name || `User #${review.userId}`}</span>
                  <span className="review-date">{formatDate(review.createdAt)}</span>
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

        {/* Review Detail */}
        <div className="review-detail">
          {selectedReview ? (
            <>
              <div className="detail-header">
                <h2>Review Details</h2>
                <button
                  className="btn-delete"
                  onClick={() => deleteReview(selectedReview.id)}
                >
                  Delete
                </button>
              </div>
              
              <div className="detail-content">
                <div className="detail-field">
                  <label>Rating:</label>
                  <span className="stars large">{renderStars(selectedReview.rating)}</span>
                </div>
                <div className="detail-field">
                  <label>Product:</label>
                  <span>{selectedReview.product?.name || `Product #${selectedReview.productId}`}</span>
                </div>
                <div className="detail-field">
                  <label>User:</label>
                  <span>{selectedReview.user?.name || `User #${selectedReview.userId}`}</span>
                </div>
                <div className="detail-field">
                  <label>User Email:</label>
                  <a href={`mailto:${selectedReview.user?.email}`}>{selectedReview.user?.email || '-'}</a>
                </div>
                <div className="detail-field">
                  <label>Review Date:</label>
                  <span>{formatDate(selectedReview.createdAt)}</span>
                </div>
                <div className="detail-field">
                  <label>Comment:</label>
                  <div className="comment-content">{selectedReview.comment || 'No comment'}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a review to view details</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-reviews {
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
        
        .stat-rating .stat-value {
          color: #ffc107;
        }
        
        .rating-distribution {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .rating-distribution h3 {
          font-size: 16px;
          margin: 0 0 15px 0;
          color: #333;
        }
        
        .distribution-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .distribution-bar {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .distribution-bar .stars {
          width: 70px;
          color: #ffc107;
          font-size: 14px;
        }
        
        .bar-container {
          flex: 1;
          height: 10px;
          background: #eee;
          border-radius: 5px;
          overflow: hidden;
        }
        
        .bar-fill {
          height: 100%;
          background: #ffc107;
          transition: width 0.3s;
        }
        
        .distribution-bar .count {
          width: 40px;
          text-align: right;
          font-size: 14px;
          color: #666;
        }
        
        .filters-bar {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
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
        
        .reviews-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          height: calc(100vh - 500px);
          min-height: 400px;
        }
        
        .reviews-list {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow-y: auto;
        }
        
        .review-card {
          padding: 15px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .review-card:hover {
          background: #f8f9fa;
        }
        
        .review-card.selected {
          background: #e7f3ff;
          border-left: 3px solid #007bff;
        }
        
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .review-stars {
          color: #ffc107;
          font-size: 14px;
        }
        
        .review-product {
          font-size: 13px;
          color: #666;
        }
        
        .review-comment {
          font-size: 13px;
          color: #333;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        
        .review-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #999;
        }
        
        .review-detail {
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
        
        .stars.large {
          font-size: 20px;
          color: #ffc107;
        }
        
        .comment-content {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 4px;
          white-space: pre-wrap;
          line-height: 1.5;
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
          .reviews-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
