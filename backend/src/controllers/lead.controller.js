const prisma = require('../utils/prisma');
const {
  createLeadSchema,
  updateLeadSchema,
  updateStatusSchema,
  assignLeadSchema,
  leadQuerySchema,
} = require('../validators/lead.validator');

const getZodDetails = (error) => {
  const issues = error?.issues || error?.errors || [];
  return issues.map((e) => ({
    field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
    message: e.message,
  }));
};

/**
 * GET /api/leads
 * Paginated, searchable, and filterable lead list with role-based visibility.
 */
const getLeads = async (req, res, next) => {
  try {
    const queryValidation = leadQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid query parameters',
        details: getZodDetails(queryValidation.error),
      });
    }

    const { page, limit, search, status, assignedToId, source, course, city } = queryValidation.data;

    // Role-based visibility enforcement
    const where = {};

    if (req.user.role === 'COUNSELLOR') {
      // Counsellor can ONLY view leads assigned to themselves
      where.assignedToId = req.user.id;
    } else if (assignedToId) {
      // Admins & Managers can filter by assignedToId
      where.assignedToId = assignedToId;
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = { contains: source, mode: 'insensitive' };
    }

    if (course) {
      where.course = { contains: course, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { course: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { formResponseId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: leads,
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
 * GET /api/leads/:id
 * Retrieve lead details with ownership check.
 */
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Lead not found',
      });
    }

    // Counsellor ownership boundary check
    if (req.user.role === 'COUNSELLOR' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You can only access your assigned leads',
      });
    }

    return res.status(200).json(lead);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/leads
 * Create a new lead (Admin & Manager).
 */
const createLead = async (req, res, next) => {
  try {
    const validationResult = createLeadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid lead payload',
        details: getZodDetails(validationResult.error),
      });
    }

    const data = validationResult.data;

    // Check duplicate formResponseId if provided
    if (data.formResponseId) {
      const existing = await prisma.lead.findUnique({
        where: { formResponseId: data.formResponseId },
      });
      if (existing) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'A lead with this Google Form response ID already exists',
        });
      }
    }

    // Verify assignedToId if provided
    if (data.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assignedToId },
      });
      if (!assignee || !assignee.isActive || assignee.role !== 'COUNSELLOR') {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Assigned user must be an active counsellor',
        });
      }
    }

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        source: data.source || 'Manual Entry',
        course: data.course || null,
        city: data.city || null,
        formResponseId: data.formResponseId || null,
        status: data.status || (data.assignedToId ? 'ASSIGNED' : 'NEW'),
        assignedToId: data.assignedToId || null,
        nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : null,
        notes: data.notes || null,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/leads/:id
 * Update general lead information.
 */
const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'NotFound', message: 'Lead not found' });
    }

    // Counsellor ownership check
    if (req.user.role === 'COUNSELLOR' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You can only update your assigned leads',
      });
    }

    const validationResult = updateLeadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid update payload',
        details: getZodDetails(validationResult.error),
      });
    }

    const updateData = validationResult.data;
    if (updateData.nextFollowUp !== undefined) {
      updateData.nextFollowUp = updateData.nextFollowUp ? new Date(updateData.nextFollowUp) : null;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(200).json(updatedLead);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/leads/:id/status
 * Update lead status.
 */
const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'NotFound', message: 'Lead not found' });
    }

    if (req.user.role === 'COUNSELLOR' && lead.assignedToId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You can only update status for your assigned leads',
      });
    }

    const validationResult = updateStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid status payload',
        details: getZodDetails(validationResult.error),
      });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status: validationResult.data.status },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(200).json(updatedLead);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/leads/:id/assign
 * Assign lead to a counsellor (Admin & Manager only).
 */
const assignLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: 'NotFound', message: 'Lead not found' });
    }

    const validationResult = assignLeadSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid assignment payload',
        details: getZodDetails(validationResult.error),
      });
    }

    const { assignedToId } = validationResult.data;

    // Verify target user is active counsellor
    const targetUser = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!targetUser || !targetUser.isActive || targetUser.role !== 'COUNSELLOR') {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Target user must be an active counsellor',
      });
    }

    const isFirstAssignment = !lead.assignedToId;
    const newStatus = isFirstAssignment && lead.status === 'NEW' ? 'ASSIGNED' : lead.status;

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: {
          assignedToId,
          status: newStatus,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          action: isFirstAssignment ? 'LEAD_ASSIGNED' : 'LEAD_REASSIGNED',
          entity: 'Lead',
          entityId: id,
          userId: req.user.id,
          details: `Assigned lead to counsellor ${targetUser.name} (${targetUser.email})`,
        },
      }),
    ]);

    return res.status(200).json(updatedLead);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/leads/:id/reassign
 * Reassign lead to another counsellor (Admin & Manager only).
 */
const reassignLead = async (req, res, next) => {
  return assignLead(req, res, next);
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  reassignLead,
};
