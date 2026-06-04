const rateLimit = require('express-rate-limit');

// 10 attempts per 15 minutes per IP — blocks brute-force
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,  // sends RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts from this IP, please try again in 15 minutes.',
  },
});