const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const auth = require('../middleware/auth');

router.get('/smart', auth, insightController.getSmartInsights);

module.exports = router;
