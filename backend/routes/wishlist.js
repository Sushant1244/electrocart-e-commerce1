const express = require('express');
const router = express.Router();
const controller = require('../controllers/wishlistController');
const authGuard = require('../helper/authguard');

// Add to wishlist (authenticated or anonymous allowed — userId attached if token present)
router.post('/', authGuard, controller.add);
// List current user's wishlist (requires auth)
router.get('/', authGuard, controller.list);
// Remove by id (requires auth)
router.delete('/:id', authGuard, controller.remove);

module.exports = router;
