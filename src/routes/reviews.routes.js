const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/reviews.controller');

router.post('/', authenticate, c.createReview);
router.get('/', c.getReviews);
router.get('/given', authenticate, c.getMyReviewsGiven);
router.get('/received', authenticate, c.getMyReviewsReceived);
router.get('/user/:id', c.getUserReviews);
router.get('/:id', c.getReview);
router.put('/:id', authenticate, c.updateReview);
router.delete('/:id', authenticate, c.deleteReview);
router.post('/:id/respond', authenticate, c.respondToReview);

module.exports = router;