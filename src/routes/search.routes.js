const router = require('express').Router();
const c = require('../controllers/search.controller');

router.get('/', c.globalSearch);
router.get('/providers', c.searchProviders);
router.get('/jobs', c.searchJobs);
router.get('/projects', c.searchProjects);
router.get('/autocomplete', c.autocomplete);
router.get('/filters', c.getFilters);

module.exports = router;
