const adapter = require('../models/adapter');
const pgConfig = require('../config/sequelize');
const { Product: PgProduct } = pgConfig || {};

// GET /api/reviews - List all reviews (admin only)
exports.listReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, productId, rating, sortBy } = req.query;
    const offset = (page - 1) * limit;
    
    let query = {};
    
    // Filter by product
    if (productId) {
      query.productId = productId;
    }
    
    // Filter by rating
    if (rating) {
      query.rating = parseInt(rating);
    }
    
    const { Review } = pgConfig || {};
    if (!Review) {
      return res.status(503).json({ success: false, message: 'Database not configured' });
    }
    
    let order = [['createdAt', 'DESC']];
    if (sortBy === 'rating-desc') {
      order = [['rating', 'DESC']];
    } else if (sortBy === 'rating-asc') {
      order = [['rating', 'ASC']];
    }
    
    const { count, rows } = await Review.findAndCountAll({
      where: query,
      limit: parseInt(limit),
      offset,
      order,
      include: PgProduct ? [
        { model: PgProduct, as: 'product', attributes: ['id', 'name', 'slug'] }
      ] : []
    });
    
    const reviews = rows.map(r => {
      const obj = r.toJSON();
      obj._id = obj.id;
      return obj;
    });
    
    res.json({
      success: true,
      reviews,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('listReviews error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/stats - Get review statistics (admin only)
exports.getReviewStats = async (req, res) => {
  try {
    if (!pgConfig || !pgConfig.Review) {
      return res.status(503).json({ success: false, message: 'Database not configured' });
    }
    const { Review, Product } = pgConfig;
    
    let avgRatingFn;
    try { avgRatingFn = require('sequelize').fn; } catch (e) { /* ignore */ }
    
    const totalReviews = await Review.count();
    const avgRating = avgRatingFn ? await Review.findOne({
      attributes: [
        [avgRatingFn('AVG', require('sequelize').col('rating')), 'avgRating']
      ]
    }) : null;
    
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = await Review.count({ where: { rating: i } });
    }
    
    const productsWithReviews = await Review.findAll({
      attributes: ['productId'],
      group: ['productId']
    });
    
    res.json({
      success: true,
      stats: {
        totalReviews,
        avgRating: avgRating?.dataValues?.avgRating ? parseFloat(avgRating.dataValues.avgRating).toFixed(2) : 0,
        ratingDistribution,
        productsWithReviews: productsWithReviews.length
      }
    });
  } catch (err) {
    console.error('getReviewStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/:id - Get review details (admin only)
exports.getReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await adapter.Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Get product info
    if (!PgProduct) {
      return res.json({
        success: true,
        review: {
          ...review,
          product: null,
          user: null
        }
      });
    }
    const product = await PgProduct.findByPk(review.productId, {
      attributes: ['id', 'name', 'slug']
    });
    
    // Get user info
    if (!pgConfig || !pgConfig.User) {
      // Skip user info if database not configured
      return res.json({
        success: true,
        review: {
          ...review,
          product: product ? { id: product.id, name: product.name, slug: product.slug } : null,
          user: null
        }
      });
    }
    const { User } = pgConfig;
    const user = await User.findByPk(review.userId, {
      attributes: ['id', 'name', 'email']
    });
    
    res.json({
      success: true,
      review: {
        ...review,
        product: product ? { id: product.id, name: product.name, slug: product.slug } : null,
        user: user ? { id: user.id, name: user.name, email: user.email } : null
      }
    });
  } catch (err) {
    console.error('getReview error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/reviews/:id - Update review (admin only)
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;
    
    const review = await adapter.Review.findByIdAndUpdate(id, updateData);
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    res.json({ success: true, review });
  } catch (err) {
    console.error('updateReview error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/reviews/:id - Delete review (admin only)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await adapter.Review.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('deleteReview error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
