const router = require('express').Router();
const c = require('../controllers/search.controller');

router.get('/', c.getSkills);

module.exports = router;
