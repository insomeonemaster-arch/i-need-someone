const router = require('express').Router();
const c = require('../controllers/search.controller');

router.get('/', c.getCategories);
router.get('/:module', c.getCategories);

module.exports = router;
