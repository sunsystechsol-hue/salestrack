const prisma = require('../utils/prisma');
const { webhookPayloadSchema } = require('../validators/integration.validator');

/**
 * POST /api/integrations/google-form
 * Webhook endpoint for receiving Google Form submissions via Apps Script.
 * Protected by X-Webhook-Secret header verification.
 */
const handleGoogleFormWebhook = async (req, res, next) => {
  try {
    const validationResult = webhookPayloadSchema.safeParse(req.body);
    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        details: issues.map((e) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
          message: e.message,
        })),
      });
    }

    const { formResponseId, name, phone, email, course, city } = validationResult.data;

    // 1. Check formResponseId uniqueness for Webhook Idempotency
    const existingFormLead = await prisma.lead.findUnique({
      where: { formResponseId },
    });

    if (existingFormLead) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'Lead already exists',
        leadId: existingFormLead.id,
      });
    }

    // 2. Normalize phone number for duplicate phone warning check
    const normalizedPhone = phone.replace(/\D/g, '');
    const phoneDuplicatesCount = await prisma.lead.count({
      where: {
        phone: { contains: normalizedPhone.length >= 10 ? normalizedPhone.slice(-10) : normalizedPhone },
      },
    });

    // 3. Create new Lead from Google Form submission
    const newLead = await prisma.lead.create({
      data: {
        formResponseId,
        name,
        phone,
        email: email || null,
        course: course || null,
        city: city || null,
        source: 'Google Form',
        status: 'NEW',
      },
    });

    return res.status(201).json({
      success: true,
      duplicate: false,
      potentialPhoneDuplicate: phoneDuplicatesCount > 0,
      message: 'Lead created successfully',
      leadId: newLead.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleGoogleFormWebhook,
};
