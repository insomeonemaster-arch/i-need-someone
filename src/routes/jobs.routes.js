const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/jobs.controller');

// Browse
router.get('/browse', c.browseJobs);

// My postings (employer)
router.get('/postings', authenticate, c.getMyPostings);
router.post('/postings', authenticate, c.createJob);
router.get('/postings/:id', c.getJob);
router.put('/postings/:id', authenticate, c.updateJob);
router.post('/postings/:id/close', authenticate, c.closeJob);
router.get('/postings/:id/applications', authenticate, c.getJobApplications);

// Applications (candidate)
router.post('/postings/:id/apply', authenticate, c.applyToJob);
router.get('/applications', authenticate, c.getMyApplications);
router.put('/applications/:id/status', authenticate, c.updateApplicationStatus);

module.exports = router;
