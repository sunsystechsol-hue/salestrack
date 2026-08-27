const prisma = require('../utils/prisma');

/**
 * GET /api/dashboard/counsellor
 * Calculates today's real database-derived metrics for the currently logged-in counsellor.
 * Derived strictly from req.user.id to prevent horizontal privilege escalation.
 */
const getCounsellorDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

    // Execute queries in parallel for efficiency
    const [
      leadsAssignedCount,
      callsToday,
      pendingTasksCount,
      completedTodayTasksCount,
      overdueTasksCount,
      attendanceRecord,
      todaysTasks,
      overdueTasks,
      recentLeads,
      recentCalls,
    ] = await Promise.all([
      // 1. Leads assigned to this counsellor
      prisma.lead.count({
        where: { assignedToId: userId },
      }),

      // 2. Calls logged by this counsellor today
      prisma.callLog.findMany({
        where: {
          userId,
          calledAt: { gte: startOfToday, lte: endOfToday },
        },
        select: { outcome: true, nextFollowUp: true },
      }),

      // 3. Pending tasks for counsellor
      prisma.task.count({
        where: { userId, status: 'PENDING' },
      }),

      // 4. Completed tasks today
      prisma.task.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: startOfToday, lte: endOfToday },
        },
      }),

      // 5. Overdue tasks
      prisma.task.count({
        where: {
          userId,
          dueAt: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),

      // 6. Attendance session record for today
      prisma.attendance.findUnique({
        where: {
          userId_workDate: {
            userId,
            workDate: startOfToday,
          },
        },
      }),

      // 7. Today's/Upcoming active tasks list
      prisma.task.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        take: 10,
        orderBy: { dueAt: 'asc' },
        include: {
          lead: { select: { id: true, name: true, phone: true, course: true } },
        },
      }),

      // 8. Overdue tasks list
      prisma.task.findMany({
        where: {
          userId,
          dueAt: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        take: 10,
        orderBy: { dueAt: 'asc' },
        include: {
          lead: { select: { id: true, name: true, phone: true, course: true } },
        },
      }),

      // 9. Recent assigned leads
      prisma.lead.findMany({
        where: { assignedToId: userId },
        take: 8,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          course: true,
          city: true,
          status: true,
          nextFollowUp: true,
        },
      }),

      // 10. Recent call logs
      prisma.callLog.findMany({
        where: { userId },
        take: 8,
        orderBy: { calledAt: 'desc' },
        include: {
          lead: { select: { id: true, name: true, phone: true } },
        },
      }),
    ]);

    // Compute call breakdown metrics
    const callsMade = callsToday.length;
    let interested = 0;
    let followUps = 0;
    let inquiries = 0;
    let notInterested = 0;
    let noResponse = 0;
    let converted = 0;

    callsToday.forEach((c) => {
      if (c.outcome === 'INTERESTED') interested++;
      if (c.outcome === 'FOLLOW_UP_REQUIRED' || c.outcome === 'CALL_BACK' || c.nextFollowUp) followUps++;
      if (c.outcome === 'INQUIRY') inquiries++;
      if (c.outcome === 'NOT_INTERESTED') notInterested++;
      if (c.outcome === 'NO_RESPONSE' || c.outcome === 'WRONG_NUMBER') noResponse++;
      if (c.outcome === 'CONVERTED') converted++;
    });

    return res.status(200).json({
      date: todayStr,
      metrics: {
        leadsAssigned: leadsAssignedCount,
        callsMade,
        interested,
        followUps,
        inquiries,
        notInterested,
        noResponse,
        converted,
        pendingTasks: pendingTasksCount,
        completedTasks: completedTodayTasksCount,
        overdueTasks: overdueTasksCount,
      },
      attendance: {
        loginAt: attendanceRecord?.loginAt || null,
        logoutAt: attendanceRecord?.logoutAt || null,
        totalMins: attendanceRecord?.totalMins || null,
      },
      lists: {
        todaysTasks,
        overdueTasks,
        recentLeads,
        recentCalls,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCounsellorDashboard,
};
