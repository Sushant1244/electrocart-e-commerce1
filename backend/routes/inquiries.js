const express = require('express');
const router = express.Router();
const controller = require('../controllers/inquiryController');
const authGuard = require('../helper/authguard');
const isAdmin = require('../helper/isAdmin');

// Public: submit an inquiry
router.post('/', controller.createInquiry);

// Admin-only: list inquiries
router.get('/', authGuard, isAdmin, controller.listInquiries);

// Admin-only: delete inquiry
router.delete('/:id', authGuard, isAdmin, controller.deleteInquiry);

// Admin-only: update inquiry status
router.patch('/:id', authGuard, isAdmin, controller.updateInquiryStatus);

module.exports = router;
