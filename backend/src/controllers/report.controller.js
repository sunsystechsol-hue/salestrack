const prisma = require('../utils/prisma');
const { reportQuerySchema } = require('../validators/report.validator');
const { computePresence } = require('./attendance.controller');

const getZodDetails = (error) => {
  const issues = error?.issues || error?.errors || [];
  return issues.map((e) => ({
    field: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
    message: e.message,
  }));
};

/**
 * Calculates start and end bounds in Asia/Kolkata timezone semantics.
 */
function getDateRangeBounds(range, startDate, endDate) {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

  if (range === 'YESTERDAY') {
    const yesterday = new Date(startOfToday.getTime() - 86400000);
    const yestStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return {
      start: new Date(`${yestStr}T00:00:00.000Z`),
      end: new Date(`${yestStr}T23:59:59.999Z`),
    };
  }

  if (range === 'LAST_7_DAYS') {
    const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 86400000);
    return {
      start: sevenDaysAgo,
      end: endOfToday,
    };
  }

  if (range === 'THIS_MONTH') {
    const monthStartStr = `${todayStr.slice(0, 7)}-01`;
    return {
      start: new Date(`${monthStartStr}T00:00:00.000Z`),
      end: endOfToday,
    };
  }

  if (range === 'CUSTOM' && startDate && endDate) {
    return {
      start: new Date(`${startDate}T00:00:00.000Z`),
      end: new Date(`${endDate}T23:59:59.999Z`),
    };
  }

  return {
    start: startOfToday,
    end: endOfToday,
  };
}

/**
 * GET /api/reports/management/summary
 * Management executive overview metrics computed strictly from database records.
 */
const getManagementSummary = async (req, res, next) => {
  try {
    const queryVal = reportQuerySchema.safeParse(req.query);
    if (!queryVal.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid report query parameters',
        details: getZodDetails(queryVal.error),
      });
    }

    const { range, startDate, endDate } = queryVal.data;
    const { start, end } = getDateRangeBounds(range, startDate, endDate);
    const now = new Date();

    const [
      totalLeadsCount,
      newLeadsCount,
      assignedLeadsCount,
      contactedLeadsCount,
      interestedLeadsCount,
      notInterestedLeadsCount,
      inquiryLeadsCount,
      followUpLeadsCount,
      convertedLeadsCount,
      lostLeadsCount,
      callsMadeCount,
      callsLogs,
      pendingTasksCount,
      completedTasksCount,
      overdueTasksCount,
      attendanceRecords,
    ] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { lte: end } } }),
      prisma.lead.count({ where: { status: 'NEW', createdAt: { gte: start, lte: end } } }),
      prisma.lead.count({ where: { assignedToId: { not: null }, createdAt: { lte: end } } }),
      prisma.lead.count({ where: { status: 'CONTACTED' } }),
      prisma.lead.count({ where: { status: 'INTERESTED' } }),
      prisma.lead.count({ where: { status: 'NOT_INTERESTED' } }),
      prisma.lead.count({ where: { status: 'INQUIRY' } }),
      prisma.lead.count({ where: { status: 'FOLLOW_UP' } }),
      prisma.lead.count({ where: { status: 'CONVERTED' } }),
      prisma.lead.count({ where: { status: 'LOST' } }),

      prisma.callLog.count({ where: { calledAt: { gte: start, lte: end } } }),
      prisma.callLog.findMany({
        where: { calledAt: { gte: start, lte: end } },
        select: { outcome: true, isCompleted: true, nextFollowUp: true },
      }),

      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.task.count({ where: { status: 'COMPLETED', completedAt: { gte: start, lte: end } } }),
      prisma.task.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] }, dueAt: { lt: now } } }),

      prisma.attendance.findMany({
        where: { createdAt: { lte: end } },
        include: { user: { select: { id: true, name: true, role: true } } },
      }),
    ]);

    // Compute call & follow-up breakdown
    let followUpsScheduled = 0;
    let followUpsCompleted = 0;
    let pendingFollowUps = 0;
    let overdueFollowUps = 0;

    callsLogs.forEach((c) => {
      if (c.nextFollowUp) {
        followUpsScheduled++;
        if (c.isCompleted) {
          followUpsCompleted++;
        } else if (new Date(c.nextFollowUp) < now) {
          overdueFollowUps++;
        } else {
          pendingFollowUps++;
        }
      }
    });

    // Compute attendance & live presence metrics
    let employeesLoggedIn = 0;
    let employeesLiveActive = 0;
    let employeesInactiveIdle = 0;
    let employeesLoggedOut = 0;
    let totalWorkingMins = 0;
    let activeAttendanceCount = 0;

    attendanceRecords.forEach((att) => {
      const presence = computePresence(att, now);
      if (att.loginAt) employeesLoggedIn++;
      if (presence.presenceStatus === 'ACTIVE') employeesLiveActive++;
      if (presence.presenceStatus === 'INACTIVE') employeesInactiveIdle++;
      if (presence.presenceStatus === 'LOGGED_OUT') employeesLoggedOut++;
      if (presence.liveWorkingMins > 0) {
        totalWorkingMins += presence.liveWorkingMins;
        activeAttendanceCount++;
      }
    });

    const averageWorkingTimeMins = activeAttendanceCount > 0 ? Math.round(totalWorkingMins / activeAttendanceCount) : 0;

    return res.status(200).json({
      dateRange: {
        range,
        start,
        end,
      },
      metrics: {
        totalLeads: totalLeadsCount,
        newLeads: newLeadsCount,
        assignedLeads: assignedLeadsCount,
        contactedLeads: contactedLeadsCount,
        interestedLeads: interestedLeadsCount,
        notInterestedLeads: notInterestedLeadsCount,
        inquiryLeads: inquiryLeadsCount,
        followUpLeads: followUpLeadsCount,
        convertedLeads: convertedLeadsCount,
        lostLeads: lostLeadsCount,
        callsMade: callsMadeCount,
        followUpsScheduled,
        followUpsCompleted,
        pendingFollowUps,
        overdueFollowUps,
        pendingTasks: pendingTasksCount,
        completedTasks: completedTasksCount,
        overdueTasks: overdueTasksCount,
        employeesLoggedIn,
        employeesLiveActive,
        employeesInactiveIdle,
        employeesLoggedOut,
        averageWorkingTimeMins,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/management/performance
 * Counsellor-wise performance comparison table with real database metrics.
 */
const getCounsellorPerformance = async (req, res, next) => {
  try {
    const queryVal = reportQuerySchema.safeParse(req.query);
    if (!queryVal.success) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid report query parameters',
        details: getZodDetails(queryVal.error),
      });
    }

    const { range, startDate, endDate, counsellorId } = queryVal.data;
    const { start, end } = getDateRangeBounds(range, startDate, endDate);
    const now = new Date();

    const userWhere = { role: 'COUNSELLOR', isActive: true };
    if (counsellorId) {
      userWhere.id = counsellorId;
    }

    const counsellors = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    const performanceRecords = await Promise.all(
      counsellors.map(async (c) => {
        const [
          assignedLeadsCount,
          callsLogs,
          convertedLeadsCount,
          pendingTasksCount,
          completedTasksCount,
          overdueTasksCount,
          todayStr,
        ] = await Promise.all([
          prisma.lead.count({ where: { assignedToId: c.id } }),
          prisma.callLog.findMany({
            where: { userId: c.id, calledAt: { gte: start, lte: end } },
            select: { outcome: true },
          }),
          prisma.lead.count({ where: { assignedToId: c.id, status: 'CONVERTED' } }),
          prisma.task.count({ where: { userId: c.id, status: 'PENDING' } }),
          prisma.task.count({ where: { userId: c.id, status: 'COMPLETED', completedAt: { gte: start, lte: end } } }),
          prisma.task.count({ where: { userId: c.id, status: { notIn: ['COMPLETED', 'CANCELLED'] }, dueAt: { lt: now } } }),
          now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
        ]);

        const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);

        const attRecord = await prisma.attendance.findUnique({
          where: { userId_workDate: { userId: c.id, workDate: startOfToday } },
        });

        const presence = computePresence(attRecord, now);

        let interested = 0;
        let followUps = 0;
        let inquiries = 0;
        let notInterested = 0;
        let noResponse = 0;
        let convertedCalls = 0;

        callsLogs.forEach((cl) => {
          if (cl.outcome === 'INTERESTED') interested++;
          if (cl.outcome === 'FOLLOW_UP_REQUIRED' || cl.outcome === 'CALL_BACK') followUps++;
          if (cl.outcome === 'INQUIRY') inquiries++;
          if (cl.outcome === 'NOT_INTERESTED') notInterested++;
          if (cl.outcome === 'NO_RESPONSE' || cl.outcome === 'WRONG_NUMBER') noResponse++;
          if (cl.outcome === 'CONVERTED') convertedCalls++;
        });

        // Conversion rate calculation safely handling 0 denominator
        const conversionRate = assignedLeadsCount > 0 ? parseFloat(((convertedLeadsCount / assignedLeadsCount) * 100).toFixed(1)) : 0;

        return {
          userId: c.id,
          name: c.name,
          email: c.email,
          role: c.role,
          presenceStatus: presence.presenceStatus,
          isLiveActive: presence.isLiveActive,
          lastSeenAt: presence.lastSeenAt,
          workingMins: presence.liveWorkingMins,
          leadsAssigned: assignedLeadsCount,
          callsMade: callsLogs.length,
          interested,
          followUps,
          inquiries,
          notInterested,
          noResponse,
          converted: convertedLeadsCount,
          conversionRate,
          pendingTasks: pendingTasksCount,
          completedTasks: completedTasksCount,
          overdueTasks: overdueTasksCount,
        };
      })
    );

    return res.status(200).json({
      dateRange: { range, start, end },
      data: performanceRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/management/calls
 * Aggregates call outcome distribution for management analysis.
 */
const getCallReport = async (req, res, next) => {
  try {
    const queryVal = reportQuerySchema.safeParse(req.query);
    if (!queryVal.success) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid query' });
    }

    const { range, startDate, endDate } = queryVal.data;
    const { start, end } = getDateRangeBounds(range, startDate, endDate);

    const callLogs = await prisma.callLog.findMany({
      where: { calledAt: { gte: start, lte: end } },
      select: { outcome: true },
    });

    const outcomes = {
      INTERESTED: 0,
      NOT_INTERESTED: 0,
      FOLLOW_UP_REQUIRED: 0,
      INQUIRY: 0,
      CALL_BACK: 0,
      NO_RESPONSE: 0,
      WRONG_NUMBER: 0,
      CONVERTED: 0,
      OTHER: 0,
    };

    callLogs.forEach((c) => {
      if (outcomes[c.outcome] !== undefined) {
        outcomes[c.outcome]++;
      }
    });

    return res.status(200).json({
      dateRange: { range, start, end },
      totalCalls: callLogs.length,
      outcomes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/management/leads
 * Lead status distribution report.
 */
const getLeadStatusReport = async (req, res, next) => {
  try {
    const leads = await prisma.lead.findMany({
      select: { status: true },
    });

    const statuses = {
      NEW: 0,
      ASSIGNED: 0,
      CONTACTED: 0,
      INTERESTED: 0,
      NOT_INTERESTED: 0,
      FOLLOW_UP: 0,
      INQUIRY: 0,
      CONVERTED: 0,
      LOST: 0,
    };

    leads.forEach((l) => {
      if (statuses[l.status] !== undefined) {
        statuses[l.status]++;
      }
    });

    return res.status(200).json({
      totalLeads: leads.length,
      statuses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/management/attendance
 * Detailed employee attendance report with live presence status.
 */
const getAttendanceReport = async (req, res, next) => {
  try {
    const queryVal = reportQuerySchema.safeParse(req.query);
    if (!queryVal.success) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid query' });
    }

    const { range, startDate, endDate, page, limit } = queryVal.data;
    const { start, end } = getDateRangeBounds(range, startDate, endDate);
    const now = new Date();

    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      prisma.attendance.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.attendance.findMany({
        where: { createdAt: { gte: start, lte: end } },
        skip,
        take: limit,
        orderBy: { workDate: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    const mappedRecords = records.map((rec) => ({
      ...rec,
      ...computePresence(rec, now),
    }));

    return res.status(200).json({
      data: mappedRecords,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/management/followups
 * Scheduled follow-ups management report.
 */
const getFollowupReport = async (req, res, next) => {
  try {
    const queryVal = reportQuerySchema.safeParse(req.query);
    if (!queryVal.success) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid query' });
    }

    const { page, limit } = queryVal.data;
    const now = new Date();
    const skip = (page - 1) * limit;

    const where = { nextFollowUp: { not: null } };

    const [total, followups] = await Promise.all([
      prisma.callLog.count({ where }),
      prisma.callLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nextFollowUp: 'asc' },
        include: {
          lead: { select: { id: true, name: true, phone: true, course: true, assignedTo: { select: { name: true } } } },
          user: { select: { name: true } },
        },
      }),
    ]);

    const mapped = followups.map((f) => {
      let isOverdue = false;
      if (!f.isCompleted && new Date(f.nextFollowUp) < now) {
        isOverdue = true;
      }
      return {
        ...f,
        isOverdue,
      };
    });

    return res.status(200).json({
      data: mapped,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/management/tasks
 * Management task activity report.
 */
const getTaskReport = async (req, res, next) => {
  try {
    const queryVal = reportQuerySchema.safeParse(req.query);
    if (!queryVal.success) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid query' });
    }

    const { page, limit } = queryVal.data;
    const skip = (page - 1) * limit;
    const now = new Date();

    const [total, tasks] = await Promise.all([
      prisma.task.count(),
      prisma.task.findMany({
        skip,
        take: limit,
        orderBy: { dueAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          lead: { select: { id: true, name: true, phone: true, course: true } },
        },
      }),
    ]);

    const mapped = tasks.map((t) => ({
      ...t,
      isOverdue: t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueAt) < now,
    }));

    return res.status(200).json({
      data: mapped,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/management/export
 * Generates downloadable CSV reports.
 * Excludes sensitive user fields (passwordHash, JWTs, secrets).
 */
const exportReportCSV = async (req, res, next) => {
  try {
    const queryVal = reportQuerySchema.safeParse(req.query);
    if (!queryVal.success) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid CSV export query' });
    }

    const { type, range, startDate, endDate } = queryVal.data;
    const { start, end } = getDateRangeBounds(range, startDate, endDate);
    const now = new Date();

    let csvContent = '';
    let filename = `report_${type || 'summary'}_${Date.now()}.csv`;

    if (type === 'performance') {
      const counsellors = await prisma.user.findMany({
        where: { role: 'COUNSELLOR', isActive: true },
        select: { id: true, name: true, email: true, role: true },
      });

      const rows = ['"Counsellor Name","Email","Leads Assigned","Calls Made","Interested","Followups","Inquiries","Not Interested","Converted","Conversion Rate %","Presence Status"'];

      for (const c of counsellors) {
        const [assigned, calls, converted, att] = await Promise.all([
          prisma.lead.count({ where: { assignedToId: c.id } }),
          prisma.callLog.findMany({ where: { userId: c.id, calledAt: { gte: start, lte: end } }, select: { outcome: true } }),
          prisma.lead.count({ where: { assignedToId: c.id, status: 'CONVERTED' } }),
          prisma.attendance.findFirst({ where: { userId: c.id }, orderBy: { createdAt: 'desc' } }),
        ]);

        const presence = computePresence(att, now);
        let interested = 0;
        let followUps = 0;
        let inquiries = 0;
        let notInterested = 0;

        calls.forEach((cl) => {
          if (cl.outcome === 'INTERESTED') interested++;
          if (cl.outcome === 'FOLLOW_UP_REQUIRED' || cl.outcome === 'CALL_BACK') followUps++;
          if (cl.outcome === 'INQUIRY') inquiries++;
          if (cl.outcome === 'NOT_INTERESTED') notInterested++;
        });

        const rate = assigned > 0 ? ((converted / assigned) * 100).toFixed(1) : '0';
        rows.push(`"${c.name}","${c.email}",${assigned},${calls.length},${interested},${followUps},${inquiries},${notInterested},${converted},"${rate}%","${presence.presenceStatus}"`);
      }

      csvContent = rows.join('\n');
    } else if (type === 'attendance') {
      const records = await prisma.attendance.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { user: { select: { name: true, email: true, role: true } } },
        orderBy: { workDate: 'desc' },
      });

      const rows = ['"Employee Name","Email","Role","Work Date","Login Time","Logout Time","Working Duration (Mins)","Presence Status"'];
      records.forEach((r) => {
        const presence = computePresence(r, now);
        rows.push(`"${r.user?.name || '—'}","${r.user?.email || '—'}","${r.user?.role || '—'}","${r.workDate.toISOString().slice(0, 10)}","${r.loginAt.toISOString()}","${r.logoutAt ? r.logoutAt.toISOString() : 'Active'}","${presence.liveWorkingMins}","${presence.presenceStatus}"`);
      });

      csvContent = rows.join('\n');
    } else {
      // Default summary CSV export
      csvContent = `"Report Type","Date Range","Generated At"\n"${type || 'Summary'}","${range}","${now.toISOString()}"`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getManagementSummary,
  getCounsellorPerformance,
  getCallReport,
  getLeadStatusReport,
  getAttendanceReport,
  getFollowupReport,
  getTaskReport,
  exportReportCSV,
};
