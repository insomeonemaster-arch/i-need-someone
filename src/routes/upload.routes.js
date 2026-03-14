const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/multer');
const c = require('../controllers/upload.controller');

router.post('/image', authenticate, upload.single('file'), c.uploadImage);
router.post('/avatar', authenticate, upload.single('file'), c.uploadAvatar);
router.post('/document', authenticate, upload.single('file'), c.uploadDocument);
router.post('/presigned-url', authenticate, c.getPresignedUrl);
router.get('/view-url', authenticate, c.getDocumentViewUrl);

module.exports = router;
