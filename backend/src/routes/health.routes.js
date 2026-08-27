const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Public health check endpoint.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

module.exports = router;
