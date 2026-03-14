const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/provider.controller');

router.get('/profile', authenticate, c.getMyProfile);
router.post('/profile', authenticate, c.createProfile);
router.put('/profile', authenticate, c.updateProfile);

router.get('/skills', authenticate, c.getSkills);
router.post('/skills', authenticate, c.addSkill);
router.delete('/skills/:id', authenticate, c.removeSkill);

router.get('/certifications', authenticate, c.getCertifications);
router.post('/certifications', authenticate, c.addCertification);
router.put('/certifications/:id', authenticate, c.updateCertification);
router.delete('/certifications/:id', authenticate, c.deleteCertification);

router.get('/portfolio', authenticate, c.getPortfolio);
router.post('/portfolio', authenticate, c.addPortfolioItem);
router.put('/portfolio/:id', authenticate, c.updatePortfolioItem);
router.delete('/portfolio/:id', authenticate, c.deletePortfolioItem);

router.get('/:id', c.getPublicProfile);

module.exports = router;
