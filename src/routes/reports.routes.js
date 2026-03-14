const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/disputes.controller');

router.post('/', authenticate, c.createReport);

module.exports = router;
