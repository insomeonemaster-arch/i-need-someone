const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/provider', require('./provider.routes'));
router.use('/providers', require('./provider.routes')); // public alias

router.use('/local-services', require('./localServices.routes'));
router.use('/jobs', require('./jobs.routes'));
router.use('/projects', require('./projects.routes'));

router.use('/conversations', require('./messaging.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/reviews', require('./reviews.routes'));

router.use('/payments', require('./payments.routes'));
router.use('/support', require('./support.routes'));
router.use('/disputes', require('./disputes.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/verification', require('./verification.routes'));

router.use('/search', require('./search.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/skills', require('./skills.routes'));

router.use('/ins', require('./ins.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/upload', require('./upload.routes'));

module.exports = router;
