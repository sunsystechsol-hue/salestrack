const prisma = require('../utils/prisma');
const { attendanceQuerySchema } = require('../validators/attendance.validator');

const INACTIVITY_THRESHOLD_MS = parseInt(process.env.INACTIVITY_THRESHOLD_MS || '300000', 10); // 5 minutes default

const getZodDetails = (error) => {
  const issues = error?.issues || error?.errors || [];
  return issues.map((e) => ({
    field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
    message: e.message,
  }));
};

/**
 * Computes live presence status and active session attributes.
 * Server controls threshold and reference timestamps.
 */
function computePresence(rec, now = new Date()) {
  if (!rec) {
    return {
      isLiveActive: false,
      presenceStatus: 'OFFLINE',
      lastSeenAt: null,
      liveWorkingMins: 0,
    };
  }

  const loginTime = new Date(rec.loginAt).getTime();
  const nowTime = now.getTime();

  if (rec.logoutAt) {
    return {
      isLiveActive: false,
      presenceStatus: 'LOGGED_OUT',
      lastSeenAt: rec.lastSeenAt || rec.logoutAt,
      liveWorkingMins: rec.totalMins || Math.max(0, Math.round((new Date(rec.logoutAt).getTime() - loginTime) / 60000)),
    };
  }

  const refTime = rec.lastSeenAt
    ? new Date(rec.lastSeenAt).getTime()
    : loginTime;

  const isLiveActive = nowTime - refTime <= INACTIVITY_THRESHOLD_MS;
  const presenceStatus = isLiveActive ? 'ACTIVE' : 'INACTIVE';
  const liveWorkingMins = Math.max(0, Math.round((nowTime - loginTime) / 60000));

  return {
    isLiveActive,
    presenceStatus,
    lastSeenAt: rec.lastSeenAt || rec.loginAt,
    liveWorkingMins,
  };
}

/**
 * POST /api/attendance/heartbeat
 * Protected heartbeat endpoint. Server updates lastSeenAt timestamp.
 * Rejects client overrides for loginAt, logoutAt, totalMins, or lastSeenAt.
 */
const heartbeat = async (req, res, next) => {
  try {
    const userId = req.user.id; // Strictly from JWT
    const now = new Date();

    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const workDate = new Date(`${todayStr}T00:00:00.000Z`);

    // Upsert today's attendance & update lastSeenAt
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_workDate: {
          userId,
          workDate,
        },
      },
      update: {
        lastSeenAt: now,
        updatedAt: now,
      },
      create: {
        userId,
        workDate,
        loginAt: now,
        lastSeenAt: now,
      },
    });

    const presence = computePresence(attendance, now);

    return res.status(200).json({
      success: true,
      message: 'Heartbeat received',
      attendance: {
        id: attendance.id,
        workDate: attendance.workDate,
        loginAt: attendance.loginAt,
        logoutAt: attendance.logoutAt,
        lastSeenAt: attendance.lastSeenAt,
        ...presence,
      },
    });
  } catch (error) {
    next(error);
  }
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
        lastSeenAt: now,
        totalMins,
      },
    });

    const presence = computePresence(updated, now);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      attendance: {
        id: updated.id,
        workDate: updated.workDate,
        loginAt: updated.loginAt,
        logoutAt: updated.logoutAt,
        lastSeenAt: updated.lastSeenAt,
        totalMins: updated.totalMins,
        ...presence,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/attendance
 * Retrieves attendance records with live presence indicators and role-based isolation.
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
    const now = new Date();

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

    const mappedRecords = records.map((rec) => ({
      ...rec,
      ...computePresence(rec, now),
    }));

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: mappedRecords,
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
 * Retrieves current user's attendance history with live presence attributes.
 */
const getMyAttendance = async (req, res, next) => {
  try {
    const now = new Date();
    const records = await prisma.attendance.findMany({
      where: { userId: req.user.id },
      orderBy: { workDate: 'desc' },
      take: 30,
    });

    const mappedRecords = records.map((rec) => ({
      ...rec,
      ...computePresence(rec, now),
    }));

    return res.status(200).json(mappedRecords);
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
    const now = new Date();

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

    return res.status(200).json({
      ...record,
      ...computePresence(record, now),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  heartbeat,
  logoutAttendance,
  getAttendance,
  getMyAttendance,
  getAttendanceById,
  computePresence,
  INACTIVITY_THRESHOLD_MS,
};
