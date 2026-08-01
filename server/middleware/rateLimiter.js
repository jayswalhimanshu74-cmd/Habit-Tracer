const rateLimit = require('express-rate-limit');

// 10 attempts per 15 minutes per IP — blocks brute-force
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    success: false,
    message: 'Too many attempts from this IP, please try again in 15 minutes.',
  },
});