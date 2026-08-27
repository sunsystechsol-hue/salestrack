const express = require('express');
const rateLimit = require('express-rate-limit');
const { verifyWebhookSecret } = require('../middleware/webhookAuth');
const { handleGoogleFormWebhook } = require('../controllers/integration.controller');

const router = express.Router();

// Rate limiter for Google Form Webhook (allows up to 100 requests per 5 minutes)
const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/google-form', webhookLimiter, verifyWebhookSecret, handleGoogleFormWebhook);

module.exports = router;
