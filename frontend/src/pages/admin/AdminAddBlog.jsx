import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { setAuthToken } from '../../api/api';

const BLOG_CATEGORIES = [
  'Announcements',
  'Reviews',
  'Guides',
  'News',
  'Tips & Tricks',
  'General'
];

export default function AdminAddBlog(){
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [author, setAuthor] = useState('Admin');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!slug) {
      setSlug(newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!title || !content) {
      alert('Please provide blog title and content');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in as admin to add blogs. Please login and try again.');
        setLoading(false);
        return;
      }
      setAuthToken(token);

      const blogData = {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        excerpt: excerpt || content.substring(0, 150) + '...',
        content,
        image,
        author,
        category
      };

      const res = await API.post('/blogs', blogData);
      alert('Blog added successfully!');
      navigate('/admin/blogs');
    } catch (err) {
      console.error('Add blog failed', err);
      if (err.request && !err.response) {
        alert('Unable to contact backend. Please ensure backend is running.');
      } else if (err.response) {
        const msg = err.response.data?.message || 'Failed to add blog';
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Add New Blog</h1>
        <button onClick={() => navigate('/admin')} className="back-btn">
          ← Back to Dashboard
        </button>
      </div>

      <form onSubmit={submit} className="admin-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter blog title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="slug">Slug</label>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="blog-url-slug (auto-generated from title)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {BLOG_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="author">Author</label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Featured Image URL</label>
          <input
            type="text"
            id="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="/uploads/image-name.png"
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Enter the image path from /uploads folder
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Excerpt</label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short description (optional, auto-generated from content if empty)"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your blog content here..."
            rows={15}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Blog'}
          </button>
          <button type="button" onClick={() => navigate('/admin')} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>

      <style>{`
        .admin-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .admin-header h1 {
          margin: 0;
        }
        .admin-form {
          background: #fff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
        }
        .form-group textarea {
          resize: vertical;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .submit-btn {
          padding: 12px 24px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #218838;
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cancel-btn {
          padding: 12px 24px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        .cancel-btn:hover {
          background: #5a6268;
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
      `}</style>
    </div>
  );
}
