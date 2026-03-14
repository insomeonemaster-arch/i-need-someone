const router = require('express').Router();
const { register, login, refreshToken, logout, verifyEmail, resendVerification, forgotPassword, resetPassword, oauthAuthorize, oauthCallback } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', authLimiter, refreshToken);
router.post('/logout', logout);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authenticate, resendVerification);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/oauth/:provider/authorize', oauthAuthorize);
router.get('/oauth/:provider/callback', oauthCallback);

module.exports = router;
