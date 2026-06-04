const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const auth = require('../middleware/auth');

router.get('/today', auth, challengeController.getTodayChallenge);
router.post('/complete', auth, challengeController.completeChallenge);

module.exports = router;
