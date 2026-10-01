const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, verifyEmail, resendVerification } = require('../controllers/authController');
let rateLimit;
try {
	rateLimit = require('express-rate-limit');
} catch (e) {
	// If the package isn't installed (e.g., temporary dev state), provide a no-op
	// limiter so the server can start. This is a safe fallback for local dev only.
	console.warn('[auth] express-rate-limit not installed; using no-op limiter');
	rateLimit = (opts) => (req, res, next) => next();
}

// Apply rate limiting to auth endpoints to mitigate brute-force and abuse.
const authLimiter = rateLimit({
	// allow 100 requests per 15 minutes per IP by default for auth endpoints
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many requests from this IP, please try again later.' }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);

module.exports = router;