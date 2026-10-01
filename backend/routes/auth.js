const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../controllers/secureAuthController');

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many authentication requests. Please try again later.' }
});

router.post('/register', authLimiter, auth.register);
router.post('/verify-email', authLimiter, auth.verifyEmail);
router.post('/resend-verification', authLimiter, auth.resendVerification);
router.post('/login', authLimiter, auth.login);
router.post('/otp/request', authLimiter, auth.requestOtp);
router.post('/otp/verify', authLimiter, auth.verifyOtp);
router.post('/google', authLimiter, auth.google);
router.post('/refresh', authLimiter, auth.refresh);
router.post('/logout', auth.logout);
router.post('/logout-all', auth.authMiddleware, auth.logoutAll);
router.post('/forgot-password', authLimiter, auth.forgotPassword);
router.post('/reset-password', authLimiter, auth.resetPassword);
router.post('/change-password', auth.authMiddleware, auth.changePassword);
router.post('/change-email', auth.authMiddleware, auth.changeEmail);
router.post('/2fa/setup', auth.authMiddleware, auth.setup2fa);
router.post('/2fa/enable', auth.authMiddleware, auth.enable2fa);
router.post('/2fa/verify', auth.twoFactorMiddleware, auth.verify2fa);
router.post('/2fa/disable', auth.authMiddleware, auth.disable2fa);
router.get('/me', auth.authMiddleware, auth.me);
router.get('/sessions', auth.authMiddleware, auth.sessions);
router.delete('/sessions/:id', auth.authMiddleware, auth.revokeSession);
router.delete('/account', auth.authMiddleware, auth.deleteAccount);

module.exports = router;