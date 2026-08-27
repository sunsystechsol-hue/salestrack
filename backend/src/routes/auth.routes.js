const express = require('express');
const rateLimit = require('express-rate-limit');
const { login } = require('../controllers/auth.controller');

const router = express.Router();

// Strict rate limiter for authentication routes (e.g. max 10 requests per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'TooManyRequests',
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);

module.exports = router;
