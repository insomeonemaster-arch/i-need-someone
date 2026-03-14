const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/support.controller');

router.get('/faq', c.getFaqs);
router.get('/faq/:id', c.getFaq);
router.get('/tickets', authenticate, c.getTickets);
router.post('/tickets', authenticate, c.createTicket);
router.get('/tickets/:id', authenticate, c.getTicket);
router.post('/tickets/:id/close', authenticate, c.closeTicket);
router.get('/tickets/:id/messages', authenticate, c.getTicketMessages);
router.post('/tickets/:id/messages', authenticate, c.addTicketMessage);

module.exports = router;
