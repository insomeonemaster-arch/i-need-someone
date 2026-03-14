const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/disputes.controller');

router.post('/', authenticate, c.createDispute);
router.get('/', authenticate, c.getDisputes);
router.get('/:id', authenticate, c.getDispute);
router.post('/:id/evidence', authenticate, c.addEvidence);

module.exports = router;
