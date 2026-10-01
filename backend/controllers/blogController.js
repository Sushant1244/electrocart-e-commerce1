// Blog Controller
const fs = require('fs');
const path = require('path');

const BLOGS_FILE = path.join(__dirname, '../data/blogs.json');

// Ensure blogs file exists
const ensureBlogsFile = () => {
  if (!fs.existsSync(BLOGS_FILE)) {
    fs.writeFileSync(BLOGS_FILE, JSON.stringify({ blogs: [] }, null, 2));
  }
};

// Read blogs from file
const readBlogs = () => {
  ensureBlogsFile();
  try {
    const data = fs.readFileSync(BLOGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { blogs: [] };
  }
};

// Write blogs to file
const writeBlogs = (data) => {
  fs.writeFileSync(BLOGS_FILE, JSON.stringify(data, null, 2));
};

// Get all blogs (public)
const getAllBlogs = (req, res) => {
  try {
    const data = readBlogs();
    res.json({ success: true, blogs: data.blogs || [] });
  } catch (error) {
    console.error('Error getting blogs:', error);
    res.status(500).json({ success: false, message: 'Failed to get blogs' });
  }
};

// Get single blog by ID or slug (public)
const getBlog = (req, res) => {
  try {
    const { id } = req.params;
    const data = readBlogs();
    const blogs = data.blogs || [];
    
    const blog = blogs.find(b => b.id === parseInt(id) || b.slug === id);
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    res.json({ success: true, blog });
  } catch (error) {
    console.error('Error getting blog:', error);
    res.status(500).json({ success: false, message: 'Failed to get blog' });
  }
};

// Create new blog (admin only)
const createBlog = (req, res) => {
  try {
    const { title, slug, excerpt, content, image, author, category } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    
    const data = readBlogs();
    const blogs = data.blogs || [];
    
    // Generate slug if not provided
    const blogSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check for duplicate slug
    if (blogs.some(b => b.slug === blogSlug)) {
      return res.status(400).json({ success: false, message: 'A blog with this slug already exists' });
    }
    
    const newBlog = {
      id: Date.now(),
      title,
      slug: blogSlug,
      excerpt: excerpt || content.substring(0, 150) + '...',
      content,
      image: image || '',
      author: author || 'Admin',
      date: new Date().toISOString().split('T')[0],
      category: category || 'General'
    };
    
    blogs.unshift(newBlog); // Add to beginning
    writeBlogs({ blogs });
    
    res.status(201).json({ success: true, blog: newBlog });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ success: false, message: 'Failed to create blog' });
  }
};

// Update blog (admin only)
const updateBlog = (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, content, image, author, category } = req.body;
    
    const data = readBlogs();
    const blogs = data.blogs || [];
    const index = blogs.findIndex(b => b.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    // Check for duplicate slug if slug is being changed
    if (slug && slug !== blogs[index].slug) {
      if (blogs.some(b => b.slug === slug && b.id !== parseInt(id))) {
        return res.status(400).json({ success: false, message: 'A blog with this slug already exists' });
      }
    }
    
    const blogSlug = slug || blogs[index].slug;
    
    blogs[index] = {
      ...blogs[index],
      title: title || blogs[index].title,
      slug: blogSlug,
      excerpt: excerpt || blogs[index].excerpt,
      content: content || blogs[index].content,
      image: image !== undefined ? image : blogs[index].image,
      author: author || blogs[index].author,
      category: category || blogs[index].category,
      updatedAt: new Date().toISOString()
    };
    
    writeBlogs({ blogs });
    
    res.json({ success: true, blog: blogs[index] });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ success: false, message: 'Failed to update blog' });
  }
};

// Delete blog (admin only)
const deleteBlog = (req, res) => {
  try {
    const { id } = req.params;
    
    const data = readBlogs();
    const blogs = data.blogs || [];
    const index = blogs.findIndex(b => b.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    const deletedBlog = blogs.splice(index, 1)[0];
    writeBlogs({ blogs });
    
    res.json({ success: true, message: 'Blog deleted successfully', blog: deletedBlog });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ success: false, message: 'Failed to delete blog' });
  }
};

module.exports = {
  getAllBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog
};
