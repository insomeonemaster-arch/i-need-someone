const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/multer');
const c = require('../controllers/ins.controller');

router.post('/conversations', authenticate, c.startConversation);
router.get('/conversations', authenticate, c.getConversations);
router.delete('/conversations/:id', authenticate, c.deleteConversation);
router.get('/conversations/:id/messages', authenticate, c.getMessages);
router.post('/conversations/:id/messages', authenticate, c.sendMessage);
router.post('/conversations/:id/submit', authenticate, c.submitConversation);
router.post('/voice/transcribe', authenticate, upload.single('audio'), c.transcribeVoice);
router.post('/voice/synthesize', authenticate, c.synthesizeVoice);

module.exports = router;
