/**
 * Webhook authentication middleware for Google Form integration.
 * Verifies secret header X-Webhook-Secret against GOOGLE_FORM_WEBHOOK_SECRET environment variable.
 */
const verifyWebhookSecret = (req, res, next) => {
  const webhookSecret = process.env.GOOGLE_FORM_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Webhook Error] GOOGLE_FORM_WEBHOOK_SECRET is not configured on backend.');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
    });
  }

  const clientSecret = req.headers['x-webhook-secret'] || req.headers['X-Webhook-Secret'];

  if (!clientSecret || clientSecret !== webhookSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing webhook secret',
    });
  }

  next();
};

module.exports = {
  verifyWebhookSecret,
};
