const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/messaging.controller');

router.get('/unread-count', authenticate, c.getUnreadCount);
router.get('/', authenticate, c.getConversations);
router.post('/', authenticate, c.createConversation);
router.get('/:id', authenticate, c.getConversation);
router.post('/:id/archive', authenticate, c.archiveConversation);
router.get('/:id/messages', authenticate, c.getMessages);
router.post('/:id/messages', authenticate, c.sendMessage);
router.delete('/messages/:id', authenticate, c.deleteMessage);

module.exports = router;
