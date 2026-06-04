const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController.js');
const { authLimiter } = require('../middleware/rateLimiter.js');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login); // ✅ applied here

module.exports = router;
