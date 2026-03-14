const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/verification.controller');

router.get('/status', authenticate, c.getStatus);
router.post('/documents', authenticate, c.uploadDocument);
router.get('/documents', authenticate, c.getDocuments);
router.delete('/documents/:id', authenticate, c.deleteDocument);
router.post('/background-check', authenticate, c.requestBackgroundCheck);

module.exports = router;
