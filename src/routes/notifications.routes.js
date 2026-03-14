const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/notifications.controller');

router.get('/unread-count', authenticate, c.getUnreadCount);
router.get('/settings', authenticate, c.getSettings);
router.put('/settings', authenticate, c.updateSettings);
router.get('/announcements', authenticate, c.getAnnouncements);
router.get('/announcements/:id', authenticate, c.getAnnouncement);
router.get('/', authenticate, c.getNotifications);
router.put('/:id/read', authenticate, c.markRead);
router.post('/read-all', authenticate, c.markAllRead);
router.delete('/:id', authenticate, c.deleteNotification);

module.exports = router;
