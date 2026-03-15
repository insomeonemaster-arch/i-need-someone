const router = require('express').Router();
const { authenticate, requireProvider } = require('../middleware/auth');
const c = require('../controllers/localServices.controller');

// Browse (public-ish)
router.get('/browse', authenticate, c.browse);
router.get('/requests/browse', authenticate, c.browseOpenRequests);

// Service Requests (client)
router.get('/requests', authenticate, c.getRequests);
router.post('/requests', authenticate, c.createRequest);
router.get('/requests/:id', authenticate, c.getRequest);
router.put('/requests/:id', authenticate, c.updateRequest);
router.post('/requests/:id/cancel', authenticate, c.cancelRequest);

// Quotes
router.get('/requests/:id/quotes', authenticate, c.getQuotes);
router.post('/requests/:id/quotes', authenticate, requireProvider, c.createQuote);
router.post('/quotes/:id/accept', authenticate, c.acceptQuote);
router.post('/quotes/:id/reject', authenticate, c.rejectQuote);

module.exports = router;
