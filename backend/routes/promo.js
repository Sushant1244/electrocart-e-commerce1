const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validatePromoCode, applyPromoCode, getAllPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, getPromoTemplates } = require('../controllers/promoController');

// Public routes
router.post('/validate', validatePromoCode);
router.post('/apply', authMiddleware, applyPromoCode);

// Admin routes
router.get('/templates', authMiddleware, adminMiddleware, getPromoTemplates);
router.get('/', authMiddleware, adminMiddleware, getAllPromoCodes);
router.post('/', authMiddleware, adminMiddleware, createPromoCode);
router.put('/:code', authMiddleware, adminMiddleware, updatePromoCode);
router.delete('/:code', authMiddleware, adminMiddleware, deletePromoCode);

module.exports = router;
