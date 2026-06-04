const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Public route - no auth required
router.get('/:username', userController.getUserProfile);

module.exports = router;
