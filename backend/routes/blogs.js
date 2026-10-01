const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const isAdmin = require('../helper/isAdmin');

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlog);

// Admin routes (protected)
router.post('/', isAdmin, blogController.createBlog);
router.put('/:id', isAdmin, blogController.updateBlog);
router.delete('/:id', isAdmin, blogController.deleteBlog);

module.exports = router;
