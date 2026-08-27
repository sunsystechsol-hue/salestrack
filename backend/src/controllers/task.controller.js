const prisma = require('../utils/prisma');
const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  reassignTaskSchema,
  taskQuerySchema,
} = require('../validators/task.validator');

const getZodDetails = (error) => {
  const issues = error?.issues || error?.errors || [];
  return issues.map((e) => ({
    field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
    message: e.message,
  }));
};

/**
 * POST /api/tasks
 * Admin/Manager task creation with target employee & optional lead validation.
 */
const createTask = async (req, res, next) => {
  try {
    const validationResult = createTaskSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid task creation payload',
        details: getZodDetails(validationResult.error),
      });
    }

    const { title, description, dueAt, userId, leadId } = validationResult.data;

    // Verify assigned target user
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || !targetUser.isActive) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Assigned employee does not exist or is inactive',
      });
    }

    // Verify optional lead
    if (leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Associated lead not found',
        });
      }
    }

    const dueDate = new Date(dueAt);

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueAt: dueDate,
        userId,
        leadId: leadId || null,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        lead: { select: { id: true, name: true, phone: true, course: true } },
      },
    });

    // Create AuditLog entry
    await prisma.auditLog.create({
      data: {
        action: 'TASK_CREATED',
        entity: 'Task',
        entityId: task.id,
        userId: req.user.id,
        details: JSON.stringify({
          title: task.title,
          assignedToId: task.userId,
          leadId: task.leadId,
          dueAt: task.dueAt,
        }),
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks
 * Paginated task listing with search, filtering, and counsellor role isolation.
 */
const getTasks = async (req, res, next) => {
  try {
    const queryValidation = taskQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid task query parameters',
        details: getZodDetails(queryValidation.error),
      });
    }

    const { page, limit, status, userId, leadId, search, due } = queryValidation.data;
    const now = new Date();

    const where = {};

    // Role-based isolation
    if (req.user.role === 'COUNSELLOR') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (status) {
      where.status = status;
    }

    // Due filter logic
    if (due === 'OVERDUE') {
      where.dueAt = { lt: now };
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    } else if (due === 'TODAY') {
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
      const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);
      where.dueAt = { gte: startOfToday, lte: endOfToday };
    } else if (due === 'PENDING') {
      where.status = 'PENDING';
    } else if (due === 'COMPLETED') {
      where.status = 'COMPLETED';
    }

    // Search filter logic
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { lead: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          lead: { select: { id: true, name: true, phone: true, course: true, city: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: tasks,
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
 * GET /api/tasks/:id
 * Task detail view with Counsellor ownership check.
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        lead: { select: { id: true, name: true, phone: true, course: true, city: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'NotFound', message: 'Task not found' });
    }

    if (req.user.role === 'COUNSELLOR' && task.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You can only view tasks assigned to you',
      });
    }

    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tasks/:id
 * Full update for Admin/Manager; status-only update for Counsellor on assigned task.
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ error: 'NotFound', message: 'Task not found' });
    }

    if (req.user.role === 'COUNSELLOR' && task.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You can only modify tasks assigned to you',
      });
    }

    const validationResult = updateTaskSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid task update payload',
        details: getZodDetails(validationResult.error),
      });
    }

    const updates = { ...validationResult.data };

    // Prevent counsellors from modifying non-status fields
    if (req.user.role === 'COUNSELLOR') {
      delete updates.userId;
      delete updates.leadId;
      delete updates.dueAt;
      delete updates.title;
      delete updates.description;
    }

    // Handle completedAt timestamp control
    if (updates.status) {
      if (updates.status === 'COMPLETED') {
        updates.completedAt = new Date();
      } else if (task.status === 'COMPLETED' && updates.status !== 'COMPLETED') {
        updates.completedAt = null;
      }
    }

    if (updates.dueAt) {
      updates.dueAt = new Date(updates.dueAt);
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updates,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        lead: { select: { id: true, name: true, phone: true, course: true } },
      },
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tasks/:id/status
 * Updates task status and sets completedAt server-side when COMPLETED.
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ error: 'NotFound', message: 'Task not found' });
    }

    if (req.user.role === 'COUNSELLOR' && task.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You can only update status for your assigned tasks',
      });
    }

    const validationResult = updateTaskStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid status update payload',
        details: getZodDetails(validationResult.error),
      });
    }

    const { status } = validationResult.data;
    const completedAt = status === 'COMPLETED' ? new Date() : status === 'CANCELLED' ? null : task.completedAt;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        lead: { select: { id: true, name: true, phone: true, course: true } },
      },
    });

    // Create AuditLog entry on completion or cancellation
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await prisma.auditLog.create({
        data: {
          action: status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_CANCELLED',
          entity: 'Task',
          entityId: task.id,
          userId: req.user.id,
          details: JSON.stringify({ title: task.title, status, completedAt }),
        },
      });
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tasks/:id/reassign
 * Reassigns a task to another active employee (Admin/Manager only).
 */
const reassignTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ error: 'NotFound', message: 'Task not found' });
    }

    const validationResult = reassignTaskSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid reassignment payload',
        details: getZodDetails(validationResult.error),
      });
    }

    const { userId: targetUserId } = validationResult.data;

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser || !targetUser.isActive) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Target employee does not exist or is inactive',
      });
    }

    const previousUserId = task.userId;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { userId: targetUserId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        lead: { select: { id: true, name: true, phone: true, course: true } },
      },
    });

    // Create AuditLog entry
    await prisma.auditLog.create({
      data: {
        action: 'TASK_REASSIGNED',
        entity: 'Task',
        entityId: task.id,
        userId: req.user.id,
        details: JSON.stringify({
          title: task.title,
          previousUserId,
          newUserId: targetUserId,
        }),
      },
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  reassignTask,
};
