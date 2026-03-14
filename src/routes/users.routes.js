const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/users.controller');

router.get('/me', authenticate, c.getMe);
router.put('/me', authenticate, c.updateMe);
router.delete('/me', authenticate, c.deleteMe);
router.put('/me/password', authenticate, c.updatePassword);
router.put('/me/email', authenticate, c.updateEmail);
router.put('/me/phone', authenticate, c.updatePhone);
router.post('/me/verify-phone', authenticate, c.verifyPhone);
router.put('/me/mode', authenticate, c.switchMode);

// Sessions
router.get('/me/sessions', authenticate, c.getSessions);
router.delete('/me/sessions', authenticate, c.revokeAllSessions);
router.delete('/me/sessions/:id', authenticate, c.revokeSession);

// Settings
router.get('/me/privacy-settings', authenticate, c.getPrivacySettings);
router.put('/me/privacy-settings', authenticate, c.updatePrivacySettings);
router.get('/me/display-settings', authenticate, c.getDisplaySettings);
router.put('/me/display-settings', authenticate, c.updateDisplaySettings);

router.get('/:id', c.getUser);

module.exports = router;
