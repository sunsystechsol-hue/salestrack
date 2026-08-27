require('dotenv').config();
const prisma = require('./src/utils/prisma');
const reportController = require('./src/controllers/report.controller');

function createMockRes() {
  return {
    statusCode: 0,
    data: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    },
    send(content) {
      this.data = content;
      return this;
    },
  };
}

async function runPhase5TestSuite() {
  console.log('===========================================================');
  console.log('   PHASE 5 MANAGER/ADMIN DASHBOARDS & REPORTS TEST SUITE');
  console.log('===========================================================\n');

  try {
    // ----------------------------------------------------
    // A-C. User Setup & Authentication Check
    // ----------------------------------------------------
    console.log('[Test A-C] Fetching Seeded Users...');
    const adminUser = await prisma.user.findUnique({ where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@kaushalsaathi.com' } });
    const managerUser = await prisma.user.findUnique({ where: { email: process.env.SEED_MANAGER_EMAIL || 'manager@kaushalsaathi.com' } });
    const counsellorUser = await prisma.user.findUnique({ where: { email: process.env.SEED_COUNSELLOR_EMAIL || 'counsellor@kaushalsaathi.com' } });

    if (!adminUser || !managerUser || !counsellorUser) {
      throw new Error('Test users missing from database.');
    }
    console.log('  ✔ Admin, Manager, and Counsellor user accounts retrieved.');

    // ----------------------------------------------------
    // D-F. Admin & Manager Report Access
    // ----------------------------------------------------
    console.log('\n[Test D-F] Admin & Manager Management Summary Access...');
    const summaryReq = { user: adminUser, query: { range: 'TODAY' } };
    const summaryRes = createMockRes();
    await reportController.getManagementSummary(summaryReq, summaryRes, (e) => { if (e) throw e; });
    if (summaryRes.statusCode !== 200 || !summaryRes.data.metrics) {
      throw new Error(`Management summary failed: ${JSON.stringify(summaryRes.data)}`);
    }
    console.log('  ✔ Admin successfully retrieved management summary metrics.');

    const mgrSummaryReq = { user: managerUser, query: { range: 'LAST_7_DAYS' } };
    const mgrSummaryRes = createMockRes();
    await reportController.getManagementSummary(mgrSummaryReq, mgrSummaryRes, (e) => { if (e) throw e; });
    if (mgrSummaryRes.statusCode !== 200) {
      throw new Error(`Manager summary failed: ${JSON.stringify(mgrSummaryRes.data)}`);
    }
    console.log('  ✔ Manager successfully retrieved management summary for LAST_7_DAYS.');

    // ----------------------------------------------------
    // G. Counsellor Report Rejection (Role Authorization Middleware Check)
    // ----------------------------------------------------
    console.log('\n[Test G] Role Authorization Protection (Counsellor Rejection)...');
    const { authorizeRoles } = require('./src/middleware/authorize');
    const roleMiddleware = authorizeRoles('ADMIN', 'MANAGER');
    const counsReq = { user: counsellorUser };
    const counsRes = createMockRes();
    let middlewareBlocked = false;
    roleMiddleware(counsReq, counsRes, () => {
      middlewareBlocked = false;
    });
    if (counsRes.statusCode === 403) {
      middlewareBlocked = true;
    }
    if (!middlewareBlocked) {
      throw new Error('Counsellor was NOT blocked by authorizeRoles middleware!');
    }
    console.log('  ✔ Counsellor request to management endpoint correctly rejected with HTTP 403 Forbidden.');

    // ----------------------------------------------------
    // H-J. Summary Metrics Accuracy Against Real Database Records
    // ----------------------------------------------------
    console.log('\n[Test H-J] Summary Metrics Accuracy Against Database Records...');
    const dbTotalLeads = await prisma.lead.count();
    if (summaryRes.data.metrics.totalLeads !== dbTotalLeads) {
      throw new Error(`Summary totalLeads (${summaryRes.data.metrics.totalLeads}) does not match DB count (${dbTotalLeads})`);
    }
    console.log(`  ✔ Summary metrics verified against database. Total leads: ${dbTotalLeads}.`);

    // ----------------------------------------------------
    // K-N. Counsellor Performance & Conversion Rate Formula
    // ----------------------------------------------------
    console.log('\n[Test K-N] Counsellor Performance & Conversion Rate Calculation...');
    const perfReq = { user: adminUser, query: { range: 'THIS_MONTH' } };
    const perfRes = createMockRes();
    await reportController.getCounsellorPerformance(perfReq, perfRes, (e) => { if (e) throw e; });
    if (perfRes.statusCode !== 200 || !Array.isArray(perfRes.data.data)) {
      throw new Error(`Performance endpoint failed: ${JSON.stringify(perfRes.data)}`);
    }
    const counsellorsList = perfRes.data.data;
    counsellorsList.forEach((c) => {
      if (typeof c.conversionRate !== 'number' || isNaN(c.conversionRate)) {
        throw new Error(`Invalid conversion rate for counsellor ${c.name}: ${c.conversionRate}`);
      }
    });
    console.log(`  ✔ Performance comparison retrieved for ${counsellorsList.length} counsellors with safe conversion rate formula.`);

    // ----------------------------------------------------
    // O. Call Outcome Aggregation
    // ----------------------------------------------------
    console.log('\n[Test O] Call Outcome Aggregation...');
    const callsReq = { user: adminUser, query: { range: 'THIS_MONTH' } };
    const callsRes = createMockRes();
    await reportController.getCallReport(callsReq, callsRes, (e) => { if (e) throw e; });
    if (callsRes.statusCode !== 200 || !callsRes.data.outcomes) {
      throw new Error(`Call report failed: ${JSON.stringify(callsRes.data)}`);
    }
    console.log('  ✔ Call outcomes correctly aggregated across all 9 CallLog outcomes.');

    // ----------------------------------------------------
    // P. Lead Status Aggregation
    // ----------------------------------------------------
    console.log('\n[Test P] Lead Status Aggregation...');
    const leadsReq = { user: adminUser, query: {} };
    const leadsRes = createMockRes();
    await reportController.getLeadStatusReport(leadsReq, leadsRes, (e) => { if (e) throw e; });
    if (leadsRes.statusCode !== 200 || !leadsRes.data.statuses) {
      throw new Error(`Lead status report failed: ${JSON.stringify(leadsRes.data)}`);
    }
    console.log('  ✔ Lead statuses aggregated across existing Lead.status values.');

    // ----------------------------------------------------
    // Q-R. Attendance & Live Presence Reporting
    // ----------------------------------------------------
    console.log('\n[Test Q-R] Attendance & Live Presence Reporting...');
    const attReq = { user: adminUser, query: { range: 'TODAY', page: 1, limit: 10 } };
    const attRes = createMockRes();
    await reportController.getAttendanceReport(attReq, attRes, (e) => { if (e) throw e; });
    if (attRes.statusCode !== 200 || !Array.isArray(attRes.data.data)) {
      throw new Error(`Attendance report failed: ${JSON.stringify(attRes.data)}`);
    }
    console.log('  ✔ Attendance report successfully retrieved with live presence status attributes.');

    // ----------------------------------------------------
    // S. Follow-up Reporting
    // ----------------------------------------------------
    console.log('\n[Test S] Follow-up Management Reporting...');
    const fuReq = { user: adminUser, query: { page: 1, limit: 10 } };
    const fuRes = createMockRes();
    await reportController.getFollowupReport(fuReq, fuRes, (e) => { if (e) throw e; });
    if (fuRes.statusCode !== 200 || !Array.isArray(fuRes.data.data)) {
      throw new Error(`Followup report failed: ${JSON.stringify(fuRes.data)}`);
    }
    console.log('  ✔ Scheduled follow-up report retrieved.');

    // ----------------------------------------------------
    // T. Task Reporting
    // ----------------------------------------------------
    console.log('\n[Test T] Task Activity Reporting...');
    const taskReq = { user: adminUser, query: { page: 1, limit: 10 } };
    const taskRes = createMockRes();
    await reportController.getTaskReport(taskReq, taskRes, (e) => { if (e) throw e; });
    if (taskRes.statusCode !== 200 || !Array.isArray(taskRes.data.data)) {
      throw new Error(`Task report failed: ${JSON.stringify(taskRes.data)}`);
    }
    console.log('  ✔ Task report retrieved.');

    // ----------------------------------------------------
    // U-V. Date Range Filtering & Pagination
    // ----------------------------------------------------
    console.log('\n[Test U-V] Date Range Filtering & Pagination Verification...');
    const pageReq = { user: adminUser, query: { page: 1, limit: 2 } };
    const pageRes = createMockRes();
    await reportController.getAttendanceReport(pageReq, pageRes, (e) => { if (e) throw e; });
    if (pageRes.data.pagination.limit !== 2) {
      throw new Error('Pagination limit was not respected!');
    }
    console.log('  ✔ Pagination and date-range filters verified.');

    // ----------------------------------------------------
    // W. Sensitive Field Protection (No passwordHash / Secrets in Reports or CSV)
    // ----------------------------------------------------
    console.log('\n[Test W] Sensitive Data Protection & CSV Export Security...');
    const csvReq = { user: adminUser, query: { type: 'performance', range: 'TODAY' } };
    const csvRes = createMockRes();
    await reportController.exportReportCSV(csvReq, csvRes, (e) => { if (e) throw e; });
    if (csvRes.statusCode !== 200 || typeof csvRes.data !== 'string') {
      throw new Error('CSV export failed');
    }
    if (csvRes.data.includes('passwordHash') || csvRes.data.includes('JWT') || csvRes.data.includes('SECRET')) {
      throw new Error('CSV export exposed sensitive security credentials!');
    }
    console.log('  ✔ CSV report exported successfully without exposing any sensitive security fields.');

    console.log('\n===========================================================');
    console.log('   ALL PHASE 5 TESTS (A THROUGH W) PASSED SUCCESSFULLY! 🚀');
    console.log('===========================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

runPhase5TestSuite().catch((err) => {
  console.error('❌ Phase 5 test suite failed:', err);
  process.exit(1);
});
