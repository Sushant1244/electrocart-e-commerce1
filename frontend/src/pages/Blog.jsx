import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogs as localBlogs } from '../data/blogs';

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load blogs from local data first, then try API
    setBlogs(localBlogs);
    setLoading(false);
    
    // Try to fetch from API if available
    fetchBlogsFromAPI();
  }, []);

  const fetchBlogsFromAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/blogs', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        if (data.blogs && data.blogs.length > 0) {
          setBlogs(data.blogs);
        }
      }
    } catch (error) {
      console.log('Using local blog data');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="container" role="main">
        <div className="loading">Loading blogs...</div>
      </div>
    );
  }

  // If a blog is selected, show the full article
  if (selectedBlog) {
    return (
      <div className="container" role="main">
        <button 
          className="back-btn" 
          onClick={() => setSelectedBlog(null)}
          style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}
        >
          ← Back to Blogs
        </button>
        
        <article className="blog-detail">
          {selectedBlog.image && (
            <img 
              src={selectedBlog.image} 
              alt={selectedBlog.title}
              className="blog-detail-image"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          
          <div className="blog-detail-header">
            <span className="blog-category">{selectedBlog.category}</span>
            <h1>{selectedBlog.title}</h1>
            <div className="blog-meta">
              <span>By {selectedBlog.author}</span>
              <span> | </span>
              <span>{formatDate(selectedBlog.date)}</span>
            </div>
          </div>
          
          <div className="blog-content">
            {selectedBlog.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>
      </div>
    );
  }

  // Otherwise, show the blog list
  return (
    <div className="container" role="main">
      <div className="blog-header">
        <h1>Elecrocart Blog</h1>
        <p>Stay updated with the latest news, product reviews, and tech tips</p>
      </div>
      
      <div className="blog-grid">
        {blogs.length > 0 ? (
          blogs.map((blog) => (
            <article 
              key={blog.id} 
              className="blog-card"
              onClick={() => setSelectedBlog(blog)}
              style={{ cursor: 'pointer' }}
            >
              {blog.image && (
                <div className="blog-image-wrapper">
                  <img 
                    src={blog.image} 
                    alt={blog.title}
                    className="blog-card-image"
                    onError={(e) => { 
                      e.target.style.display = 'none'; 
                      e.target.parentElement.classList.add('no-image');
                    }}
                  />
                </div>
              )}
              
              <div className="blog-card-content">
                <span className="blog-category">{blog.category}</span>
                <h2 className="blog-card-title">{blog.title}</h2>
                <p className="blog-excerpt">{blog.excerpt}</p>
                <div className="blog-card-meta">
                  <span className="blog-author">{blog.author}</span>
                  <span className="blog-date">{formatDate(blog.date)}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="no-blogs">
            <p>No blogs available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
