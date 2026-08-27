const prisma = require('../utils/prisma');
const { attendanceQuerySchema } = require('../validators/attendance.validator');

const getZodDetails = (error) => {
  const issues = error?.issues || error?.errors || [];
  return issues.map((e) => ({
    field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
    message: e.message,
  }));
};

/**
 * POST /api/attendance/logout
 * Records logout timestamp and calculates working duration (totalMins) on the server.
 * Protected by JWT authentication.
 */
const logoutAttendance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const workDate = new Date(`${todayStr}T00:00:00.000Z`);

    // Find today's attendance record or latest active record for user
    let attendance = await prisma.attendance.findUnique({
      where: {
        userId_workDate: {
          userId,
          workDate,
        },
      },
    });

    if (!attendance) {
      attendance = await prisma.attendance.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!attendance) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'No active attendance record found for user',
      });
    }

    // Calculate server-side working duration in minutes
    const loginTime = new Date(attendance.loginAt).getTime();
    const logoutTime = now.getTime();
    const totalMins = Math.max(0, Math.round((logoutTime - loginTime) / (1000 * 60)));

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        logoutAt: now,
        totalMins,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      attendance: {
        id: updated.id,
        workDate: updated.workDate,
        loginAt: updated.loginAt,
        logoutAt: updated.logoutAt,
        totalMins: updated.totalMins,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance
 * Retrieves attendance records with role-based isolation.
 */
const getAttendance = async (req, res, next) => {
  try {
    const queryValidation = attendanceQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid attendance query parameters',
        details: getZodDetails(queryValidation.error),
      });
    }

    const { page, limit, workDate, userId } = queryValidation.data;

    const where = {};

    // Role-based visibility enforcement
    if (req.user.role === 'COUNSELLOR') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (workDate) {
      where.workDate = new Date(`${workDate}T00:00:00.000Z`);
    }

    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { workDate: 'desc' },
        include: {
          user: {
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
      data: records,
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
 * GET /api/attendance/me
 * Retrieves current user's attendance history.
 */
const getMyAttendance = async (req, res, next) => {
  try {
    const records = await prisma.attendance.findMany({
      where: { userId: req.user.id },
      orderBy: { workDate: 'desc' },
      take: 30,
    });
    return res.status(200).json(records);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance/:id
 * Retrieve specific attendance details with counsellor ownership check.
 */
const getAttendanceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await prisma.attendance.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ error: 'NotFound', message: 'Attendance record not found' });
    }

    if (req.user.role === 'COUNSELLOR' && record.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You can only view your own attendance records',
      });
    }

    return res.status(200).json(record);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logoutAttendance,
  getAttendance,
  getMyAttendance,
  getAttendanceById,
};
