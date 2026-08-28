const prisma = require('../utils/prisma');
const { createCallSchema, callQuerySchema } = require('../validators/call.validator');

const getZodDetails = (error) => {
  const issues = error?.issues || error?.errors || [];
  return issues.map((e) => ({
    field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
    message: e.message,
  }));
};

/**
 * POST /api/calls
 * Create a new call log entry for a lead.
 * Enforces lead existence and counsellor ownership check.
 */
const createCall = async (req, res, next) => {
  try {
    const validationResult = createCallSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid call log payload',
        details: getZodDetails(validationResult.error),
      });
    }

    const { leadId, calledAt, durationSec, outcome, remarks, nextFollowUp } = validationResult.data;
    const userId = req.user.id; // Always derive identity from JWT

    // Verify lead exists
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Associated lead not found',
      });
    }

    // Counsellor ownership boundary check
    if (req.user.role === 'COUNSELLOR' && lead.assignedToId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You can only log calls for your assigned leads',
      });
    }

    const callDate = calledAt ? new Date(calledAt) : new Date();
    const nextFollowUpDate = nextFollowUp ? new Date(nextFollowUp) : null;

    // Execute call creation & optional lead status/followUp update in transaction
    const [callLog] = await prisma.$transaction([
      prisma.callLog.create({
        data: {
          leadId,
          userId,
          calledAt: callDate,
          durationSec,
          outcome,
          remarks: remarks || null,
          nextFollowUp: nextFollowUpDate,
        },
        include: {
          lead: {
            select: { id: true, name: true, phone: true, course: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      // Update Lead nextFollowUp and lead status based on call outcome
      prisma.lead.update({
        where: { id: leadId },
        data: {
          ...(nextFollowUpDate ? { nextFollowUp: nextFollowUpDate } : {}),
          ...(outcome === 'INTERESTED' ? { status: 'INTERESTED' } : {}),
          ...(outcome === 'CONVERTED' ? { status: 'CONVERTED' } : {}),
          ...(outcome === 'NOT_INTERESTED' ? { status: 'NOT_INTERESTED' } : {}),
          ...(outcome === 'FOLLOW_UP_REQUIRED' ? { status: 'FOLLOW_UP' } : {}),
        },
      }),
    ]);

    return res.status(201).json(callLog);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/calls
 * List call logs with pagination, filtering, and role isolation.
 */
const getCalls = async (req, res, next) => {
  try {
    const queryValidation = callQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid query parameters',
        details: getZodDetails(queryValidation.error),
      });
    }

    const { page, limit, leadId, outcome } = queryValidation.data;

    const where = {};

    if (leadId) {
      where.leadId = leadId;
    }

    if (outcome) {
      where.outcome = outcome;
    }

    // Role-based visibility enforcement
    if (req.user.role === 'COUNSELLOR') {
      where.userId = req.user.id;
    }

    const skip = (page - 1) * limit;

    const [total, calls] = await Promise.all([
      prisma.callLog.count({ where }),
      prisma.callLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { calledAt: 'desc' },
        include: {
          lead: {
            select: { id: true, name: true, phone: true, course: true, assignedToId: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: calls,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/calls/:id
 * Retrieve specific call log with ownership verification.
 */
const getCallById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const call = await prisma.callLog.findUnique({
      where: { id },
      include: {
        lead: {
          select: { id: true, name: true, phone: true, course: true, assignedToId: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!call) {
      return res.status(404).json({ error: 'NotFound', message: 'Call log not found' });
    }

    if (req.user.role === 'COUNSELLOR' && call.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You can only view your own call logs',
      });
    }

    return res.status(200).json(call);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCall,
  getCalls,
  getCallById,
};
