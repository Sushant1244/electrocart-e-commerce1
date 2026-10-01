const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const authGuard = require('../helper/authguard');
const isAdmin = require('../helper/isAdmin');

// Admin-only routes
router.get('/', authGuard, isAdmin, controller.listUsers);
router.get('/stats', authGuard, isAdmin, controller.getUserStats);
router.get('/:id', authGuard, isAdmin, controller.getUser);
router.patch('/:id', authGuard, isAdmin, controller.updateUser);
router.delete('/:id', authGuard, isAdmin, controller.deleteUser);

module.exports = router;
