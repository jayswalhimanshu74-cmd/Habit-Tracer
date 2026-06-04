const { Router } = require('express');
const router = Router();
const { getSummary } = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.get('/summary', auth, getSummary);

module.exports = router;
