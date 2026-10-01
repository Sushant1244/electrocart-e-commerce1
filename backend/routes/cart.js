const express = require('express');
const router = express.Router();
const controller = require('../controllers/cartController');
const authGuard = require('../helper/authguard');

// Add item to cart (auth optional; sessionId may be used)
router.post('/', authGuard, controller.add);
// List items for user or session
router.get('/', authGuard, controller.list);
// Update item
router.patch('/:id', authGuard, controller.update);
// Remove
router.delete('/:id', authGuard, controller.remove);

module.exports = router;
