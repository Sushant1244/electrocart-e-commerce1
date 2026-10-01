const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  createProduct, updateProduct, deleteProduct, getProducts, getProductBySlug, getProductById,
  advancedSearch, getRelatedProducts, checkInventory, addReview, listReviews
} = require('../controllers/productController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/'); },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'_')); }
});
const upload = multer({ storage });
const productUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['video', 'productVideo'].includes(file.fieldname) && !file.mimetype.startsWith('video/')) return cb(new Error('Video upload must be a valid video file'));
    if (['images', 'image'].includes(file.fieldname) && !file.mimetype.startsWith('image/')) return cb(new Error('Image upload must be a valid image file'));
    if (!['images', 'image', 'video', 'productVideo'].includes(file.fieldname)) return cb(new Error(`Unexpected upload field: ${file.fieldname}`));
    return cb(null, true);
  }
});

// Advanced search with filters, sorting, pagination, and auto-suggestions
router.get('/search', advancedSearch);
router.get('/suggestions', advancedSearch);

// Get related products
router.get('/related/:id', getRelatedProducts);

// Check inventory availability
router.post('/check-inventory', checkInventory);

router.get('/', getProducts);
router.get('/by-id/:id', getProductById);
router.get('/:slug', getProductBySlug);

// allow authenticated users to post reviews/ratings for a product
// list reviews for a product
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const productController = require('../controllers/productController');
    if (typeof productController.listReviews === 'function') return productController.listReviews(req, res, next);
    return res.status(501).json({ message: 'Not implemented' });
  } catch (e) { return next(e); }
});

// Add review with optional photo uploads
router.post('/:id/reviews', authMiddleware, upload.array('photos', 5), async (req, res, next) => {
  try {
    const productController = require('../controllers/productController');
    if (typeof productController.addReview === 'function') return productController.addReview(req, res, next);
    return res.status(501).json({ message: 'Not implemented' });
  } catch (e) { return next(e); }
});

// admin protected
router.post('/', authMiddleware, adminMiddleware, productUpload.fields([{ name: 'images', maxCount: 10 }, { name: 'image', maxCount: 10 }, { name: 'video', maxCount: 1 }, { name: 'productVideo', maxCount: 1 }]), createProduct);
router.put('/:id', authMiddleware, adminMiddleware, productUpload.fields([{ name: 'images', maxCount: 10 }, { name: 'image', maxCount: 10 }, { name: 'video', maxCount: 1 }, { name: 'productVideo', maxCount: 1 }]), updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;