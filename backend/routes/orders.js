const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { createOrder, getMyOrders, getAllOrders, updateOrderStatus, getOrderTracking, cancelOrder, uploadProof } = require('../controllers/orderController');

// Ensure uploads/proofs directory exists
const proofsDir = path.join(__dirname, '..', 'uploads', 'proofs');
try {
  if (!fs.existsSync(proofsDir)) {
    fs.mkdirSync(proofsDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create proofs directory:', e?.message);
}

// configure multer storage for payment proofs (kept under uploads/proofs)
const proofStorage = multer.diskStorage({
	destination: function (req, file, cb) { cb(null, 'uploads/proofs'); },
	filename: function (req, file, cb) {
		// sanitize original name: remove path traversal and keep only safe chars
		const orig = path.basename(file.originalname || 'proof');
		const safe = orig.replace(/[^a-zA-Z0-9._-]/g, '_');
		cb(null, Date.now() + '-proof-' + safe);
	}
});
// allowed mimetypes
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
function proofFileFilter(req, file, cb) {
	if (!file || !file.mimetype) return cb(new Error('Invalid file upload'), false);
	if (!ALLOWED_MIMES.includes(file.mimetype)) return cb(new Error('Unsupported file type'), false);
	cb(null, true);
}
const proofUpload = multer({ storage: proofStorage, fileFilter: proofFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', authMiddleware, createOrder);
router.get('/my', authMiddleware, getMyOrders);
router.get('/track/:id', authMiddleware, getOrderTracking);

// upload proof for bank transfer or other manual payments
// expects multipart/form-data with a field named `proof`
router.post('/:id/proof', authMiddleware, proofUpload.single('proof'), uploadProof);

// admin
router.get('/', authMiddleware, adminMiddleware, getAllOrders);
router.patch('/:id', authMiddleware, adminMiddleware, updateOrderStatus);
// allow user to cancel their own order
router.patch('/:id/cancel', authMiddleware, cancelOrder);

module.exports = router;
// expose allowed mimetypes for tests
module.exports.ALLOWED_MIMES = ALLOWED_MIMES;
module.exports.proofFileFilter = proofFileFilter;