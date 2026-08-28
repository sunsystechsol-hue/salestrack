const prisma = require('../utils/prisma');
const { followupQuerySchema } = require('../validators/followup.validator');

const getZodDetails = (error) => {
  const issues = error?.issues || error?.errors || [];
  return issues.map((e) => ({
    field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
    message: e.message,
  }));
};

/**
 * GET /api/followups
 * List scheduled follow-ups with filters (PENDING, TODAY, OVERDUE, COMPLETED) and role isolation.
 */
const getFollowUps = async (req, res, next) => {
  try {
    const queryValidation = followupQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid query parameters',
        details: getZodDetails(queryValidation.error),
      });
    }

    const { page, limit, status, counsellorId, leadId } = queryValidation.data;
    const now = new Date();

    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

    const where = {
      nextFollowUp: { not: null },
    };

    if (leadId) {
      where.leadId = leadId;
    }

    // Role-based visibility enforcement
    if (req.user.role === 'COUNSELLOR') {
      where.userId = req.user.id;
    } else if (counsellorId) {
      where.userId = counsellorId;
    }

    // Status filtering logic
    if (status === 'PENDING') {
      where.nextFollowUp = { gte: now };
      where.isCompleted = false;
    } else if (status === 'TODAY') {
      where.nextFollowUp = { gte: startOfToday, lte: endOfToday };
    } else if (status === 'OVERDUE') {
      where.nextFollowUp = { lt: now };
      where.isCompleted = false;
    } else if (status === 'COMPLETED') {
      where.isCompleted = true;
    }

    const skip = (page - 1) * limit;

    const [total, followups] = await Promise.all([
      prisma.callLog.count({ where }),
      prisma.callLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nextFollowUp: 'asc' },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              phone: true,
              course: true,
              city: true,
              status: true,
              assignedToId: true,
              assignedTo: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: followups,
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
 * PATCH /api/followups/:id/complete
 * Marks a follow-up call log as completed.
 */
const completeFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;

    const callLog = await prisma.callLog.findUnique({
      where: { id },
      include: {
        lead: { select: { assignedToId: true } },
      },
    });

    if (!callLog) {
      return res.status(404).json({ error: 'NotFound', message: 'Follow-up call log not found' });
    }

    if (req.user.role === 'COUNSELLOR' && callLog.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You can only complete your own follow-ups',
      });
    }

    const updated = await prisma.callLog.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Follow-up marked as completed',
      followUp: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFollowUps,
  completeFollowUp,
};
