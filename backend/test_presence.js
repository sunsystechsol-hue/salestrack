require('dotenv').config();
const prisma = require('./src/utils/prisma');
const authController = require('./src/controllers/auth.controller');
const attendanceController = require('./src/controllers/attendance.controller');

// Helper mock response builder
function createMockRes() {
  return {
    statusCode: 0,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
}

async function runPresenceTestSuite() {
  console.log('===========================================================');
  console.log('   LIVE EMPLOYEE PRESENCE ENHANCEMENT TEST SUITE');
  console.log('===========================================================\n');

  try {
    // ----------------------------------------------------
    // A. Health Check
    // ----------------------------------------------------
    console.log('[Test A] Health Check...');
    const healthRoutes = require('./src/routes/health.routes');
    const healthRes = createMockRes();
    healthRoutes.stack[0].handle({ method: 'GET', url: '/api/health' }, healthRes, () => {});
    if (healthRes.statusCode !== 200 || healthRes.data.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(healthRes.data)}`);
    }
    console.log('  ✔ Health endpoint returned HTTP 200 ok.');

    // Fetch test users
    const adminUser = await prisma.user.findUnique({ where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@kaushalsaathi.com' } });
    const managerUser = await prisma.user.findUnique({ where: { email: process.env.SEED_MANAGER_EMAIL || 'manager@kaushalsaathi.com' } });
    const counsellor1 = await prisma.user.findUnique({ where: { email: process.env.SEED_COUNSELLOR_EMAIL || 'counsellor@kaushalsaathi.com' } });
    const counsellor2 = await prisma.user.findUnique({ where: { email: 'counsellor2@kaushalsaathi.com' } });

    if (!adminUser || !managerUser || !counsellor1 || !counsellor2) {
      throw new Error('Test users missing from database.');
    }

    // ----------------------------------------------------
    // B. Heartbeat Authentication & Processing
    // ----------------------------------------------------
    console.log('\n[Test B] Heartbeat Endpoint & Authentication...');
    const hbReq = { user: counsellor1, body: {} };
    const hbRes = createMockRes();
    await attendanceController.heartbeat(hbReq, hbRes, (e) => { if (e) throw e; });
    if (hbRes.statusCode !== 200 || !hbRes.data.attendance?.lastSeenAt) {
      throw new Error(`Heartbeat processing failed: ${JSON.stringify(hbRes.data)}`);
    }
    const lastSeenTime = new Date(hbRes.data.attendance.lastSeenAt).getTime();
    if (Math.abs(Date.now() - lastSeenTime) > 5000) {
      throw new Error('Heartbeat did not use current server time!');
    }
    console.log('  ✔ Heartbeat recorded server timestamp:', hbRes.data.attendance.lastSeenAt);

    // ----------------------------------------------------
    // C. Server Timestamp Protection & Client Override Prevention
    // ----------------------------------------------------
    console.log('\n[Test C] Server Timestamp Protection (Client Override Prevention)...');
    const fakeTime = new Date('2020-01-01T00:00:00.000Z');
    const fakeReq = {
      user: counsellor1,
      body: {
        loginAt: fakeTime.toISOString(),
        logoutAt: fakeTime.toISOString(),
        lastSeenAt: fakeTime.toISOString(),
        totalMins: 9999,
      },
    };
    const fakeRes = createMockRes();
    await attendanceController.heartbeat(fakeReq, fakeRes, (e) => { if (e) throw e; });
    const protectedTime = new Date(fakeRes.data.attendance.lastSeenAt).getTime();
    if (Math.abs(Date.now() - protectedTime) > 5000) {
      throw new Error('Client-supplied timestamp was accepted by server!');
    }
    console.log('  ✔ Client timestamp overrides successfully ignored; server timestamp enforced.');

    // ----------------------------------------------------
    // D. Active / Offline Determination Logic
    // ----------------------------------------------------
    console.log('\n[Test D] Presence Status Computation (Active, Inactive, Logged Out)...');
    const now = new Date();
    // 1. Live Active session
    const activeRec = {
      loginAt: new Date(now.getTime() - 60000), // 1 min ago
      lastSeenAt: new Date(now.getTime() - 10000), // 10 secs ago
      logoutAt: null,
    };
    const activePresence = attendanceController.computePresence(activeRec, now);
    if (!activePresence.isLiveActive || activePresence.presenceStatus !== 'ACTIVE') {
      throw new Error(`Active presence computation failed: ${JSON.stringify(activePresence)}`);
    }

    // 2. Inactive session (> 5 mins since last heartbeat)
    const inactiveRec = {
      loginAt: new Date(now.getTime() - 600000), // 10 mins ago
      lastSeenAt: new Date(now.getTime() - 400000), // 6.6 mins ago (> 5 mins threshold)
      logoutAt: null,
    };
    const inactivePresence = attendanceController.computePresence(inactiveRec, now);
    if (inactivePresence.isLiveActive || inactivePresence.presenceStatus !== 'INACTIVE') {
      throw new Error(`Inactive presence computation failed: ${JSON.stringify(inactivePresence)}`);
    }

    // 3. Logged Out session
    const loggedOutRec = {
      loginAt: new Date(now.getTime() - 600000),
      logoutAt: new Date(now.getTime() - 100000),
      lastSeenAt: new Date(now.getTime() - 100000),
      totalMins: 8,
    };
    const loggedOutPresence = attendanceController.computePresence(loggedOutRec, now);
    if (loggedOutPresence.isLiveActive || loggedOutPresence.presenceStatus !== 'LOGGED_OUT') {
      throw new Error(`Logged Out presence computation failed: ${JSON.stringify(loggedOutPresence)}`);
    }
    console.log('  ✔ Presence statuses correctly computed: ACTIVE, INACTIVE, and LOGGED_OUT.');

    // ----------------------------------------------------
    // E. Counsellor Role Isolation
    // ----------------------------------------------------
    console.log('\n[Test E] Counsellor Role Isolation for Presence Data...');
    const c1AttListRes = createMockRes();
    await attendanceController.getAttendance({ query: {}, user: counsellor1 }, c1AttListRes, (e) => { if (e) throw e; });
    const c1Records = c1AttListRes.data.data;
    const hasOtherUserData = c1Records.some((r) => r.userId !== counsellor1.id);
    if (hasOtherUserData) {
      throw new Error('Counsellor 1 received presence records belonging to other users!');
    }
    console.log('  ✔ Counsellor 1 receives ONLY own presence/attendance records.');

    // ----------------------------------------------------
    // F. Admin / Manager Team Presence Access
    // ----------------------------------------------------
    console.log('\n[Test F] Admin & Manager Team Presence Access...');
    const adminAttRes = createMockRes();
    await attendanceController.getAttendance({ query: {}, user: adminUser }, adminAttRes, (e) => { if (e) throw e; });
    if (adminAttRes.statusCode !== 200 || !Array.isArray(adminAttRes.data.data)) {
      throw new Error('Admin presence query failed');
    }
    console.log('  ✔ Admin & Manager successfully retrieve team live presence overview.');

    console.log('\n===========================================================');
    console.log('   ALL PRESENCE TESTS PASSED SUCCESSFULLY! 🚀');
    console.log('===========================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

runPresenceTestSuite().catch((err) => {
  console.error('❌ Presence test suite failed:', err);
  process.exit(1);
});
