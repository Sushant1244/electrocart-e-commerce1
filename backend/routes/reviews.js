const express = require('express');
const router = express.Router();
const controller = require('../controllers/reviewController');
const authGuard = require('../helper/authguard');
const isAdmin = require('../helper/isAdmin');

// Admin-only routes
router.get('/', authGuard, isAdmin, controller.listReviews);
router.get('/stats', authGuard, isAdmin, controller.getReviewStats);
router.get('/:id', authGuard, isAdmin, controller.getReview);
router.patch('/:id', authGuard, isAdmin, controller.updateReview);
router.delete('/:id', authGuard, isAdmin, controller.deleteReview);

module.exports = router;
