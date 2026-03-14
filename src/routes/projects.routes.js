const router = require('express').Router();
const { authenticate, requireProvider } = require('../middleware/auth');
const c = require('../controllers/projects.controller');

// Browse
router.get('/browse', c.browseProjects);

// My proposals (provider) — must come before /:id to avoid route collision
router.get('/proposals', authenticate, c.getMyProposals);
router.post('/proposals/:id/accept', authenticate, c.acceptProposal);
router.post('/proposals/:id/reject', authenticate, c.rejectProposal);

// Projects (client)
router.get('/', authenticate, c.getMyProjects);
router.post('/', authenticate, c.createProject);
router.get('/:id', authenticate, c.getProject);

// Proposals (provider)
router.post('/:id/proposals', authenticate, requireProvider, c.submitProposal);

module.exports = router;
