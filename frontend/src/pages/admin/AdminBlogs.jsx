import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { setAuthToken } from '../../api/api';

export default function AdminBlogs(){
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login as admin');
        navigate('/login');
        return;
      }
      setAuthToken(token);

      const res = await API.get('/blogs');
      setBlogs(res.data.blogs || []);
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId, blogTitle) => {
    if (!confirm(`Are you sure you want to delete "${blogTitle}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      setAuthToken(token);

      await API.delete(`/blogs/${blogId}`);
      alert('Blog deleted successfully');
      fetchBlogs();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err.response?.data?.message || 'Failed to delete blog');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading blogs...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Blogs</h1>
        <button onClick={() => navigate('/admin')} className="back-btn">
          ← Back to Dashboard
        </button>
      </div>

      <div className="admin-actions">
        <button onClick={() => navigate('/admin/add-blog')} className="add-btn">
          + Add New Blog
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="blogs-list">
        {blogs.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog.id}>
                  <td>
                    <div className="blog-title-cell">
                      {blog.image && (
                        <img 
                          src={blog.image} 
                          alt={blog.title}
                          className="blog-thumbnail"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <span>{blog.title}</span>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{blog.category}</span>
                  </td>
                  <td>{blog.author}</td>
                  <td>{formatDate(blog.date)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => navigate(`/admin/edit-blog/${blog.id}`)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(blog.id, blog.title)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No blogs found. Click "Add New Blog" to create your first blog post.</p>
          </div>
        )}
      </div>

      <style>{`
        .admin-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .admin-header h1 {
          margin: 0;
        }
        .admin-actions {
          margin-bottom: 20px;
        }
        .add-btn {
          padding: 10px 20px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .add-btn:hover {
          background: #218838;
        }
        .back-btn {
          padding: 8px 16px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
        }
        .back-btn:hover {
          background: #5a6268;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .admin-table th,
        .admin-table td {
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .admin-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }
        .admin-table tr:hover {
          background: #f8f9fa;
        }
        .blog-title-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .blog-thumbnail {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 4px;
        }
        .category-badge {
          display: inline-block;
          padding: 4px 8px;
          background: #e9ecef;
          border-radius: 4px;
          font-size: 12px;
          color: #495057;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        .edit-btn {
          padding: 6px 12px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .edit-btn:hover {
          background: #0056b3;
        }
        .delete-btn {
          padding: 6px 12px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .delete-btn:hover {
          background: #c82333;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error-message {
          color: #dc3545;
          padding: 10px;
          margin-bottom: 20px;
          background: #f8d7da;
          border-radius: 4px;
        }
        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #666;
        }
      `}</style>
    </div>
  );
}
