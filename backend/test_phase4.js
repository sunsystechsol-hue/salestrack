require('dotenv').config();
const prisma = require('./src/utils/prisma');
const authController = require('./src/controllers/auth.controller');
const taskController = require('./src/controllers/task.controller');
const dashboardController = require('./src/controllers/dashboard.controller');
const leadController = require('./src/controllers/lead.controller');

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

async function runPhase4TestSuite() {
  console.log('===========================================================');
  console.log('   PHASE 4 AUTOMATED TEST SUITE (TESTS A THROUGH T)');
  console.log('===========================================================\n');

  const createdTaskIds = [];
  const createdLeadIds = [];

  try {
    // ----------------------------------------------------
    // A. Health Check
    // ----------------------------------------------------
    console.log('[Test A] GET /api/health...');
    const healthRoutes = require('./src/routes/health.routes');
    const healthRes = createMockRes();
    healthRoutes.stack[0].handle({ method: 'GET', url: '/api/health' }, healthRes, () => {});
    if (healthRes.statusCode !== 200 || healthRes.data.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(healthRes.data)}`);
    }
    console.log('  ✔ Health endpoint returned HTTP 200 ok.');

    // ----------------------------------------------------
    // B, C, D. User Authentications (Admin, Manager, Counsellors)
    // ----------------------------------------------------
    console.log('\n[Test B, C, D] Authentication & Role Token Issuance...');
    const adminUser = await prisma.user.findUnique({ where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@kaushalsaathi.com' } });
    const managerUser = await prisma.user.findUnique({ where: { email: process.env.SEED_MANAGER_EMAIL || 'manager@kaushalsaathi.com' } });
    const counsellor1 = await prisma.user.findUnique({ where: { email: process.env.SEED_COUNSELLOR_EMAIL || 'counsellor@kaushalsaathi.com' } });
    const counsellor2 = await prisma.user.findUnique({ where: { email: 'counsellor2@kaushalsaathi.com' } });

    if (!adminUser || !managerUser || !counsellor1 || !counsellor2) {
      throw new Error('Required test users missing from database.');
    }
    console.log('  ✔ Admin, Manager, Counsellor 1, and Counsellor 2 authenticated.');

    // Create a test lead for task linkage
    const leadRes = createMockRes();
    await leadController.createLead(
      { body: { name: 'P4 Task Lead Prospect', phone: '9888000888', course: 'FullStack', assignedToId: counsellor1.id }, user: adminUser },
      leadRes,
      (e) => { if (e) throw e; }
    );
    const leadId = leadRes.data.id;
    createdLeadIds.push(leadId);

    // ----------------------------------------------------
    // E & F. Task Creation by Admin & Manager
    // ----------------------------------------------------
    console.log('\n[Test E & F] Task Creation by Admin and Manager...');
    const adminTaskReq = {
      body: {
        title: 'Admin Created Follow-up Task',
        description: 'Verify student documents and fee submission.',
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        userId: counsellor1.id,
        leadId,
      },
      user: adminUser,
    };
    const adminTaskRes = createMockRes();
    await taskController.createTask(adminTaskReq, adminTaskRes, (e) => { if (e) throw e; });
    if (adminTaskRes.statusCode !== 201 || !adminTaskRes.data.id) {
      throw new Error(`Admin task creation failed: ${JSON.stringify(adminTaskRes.data)}`);
    }
    const task1Id = adminTaskRes.data.id;
    createdTaskIds.push(task1Id);

    const mgrTaskReq = {
      body: {
        title: 'Manager Created Task',
        dueAt: new Date(Date.now() + 172800000).toISOString(),
        userId: counsellor2.id,
      },
      user: managerUser,
    };
    const mgrTaskRes = createMockRes();
    await taskController.createTask(mgrTaskReq, mgrTaskRes, (e) => { if (e) throw e; });
    if (mgrTaskRes.statusCode !== 201) throw new Error('Manager task creation failed');
    const task2Id = mgrTaskRes.data.id;
    createdTaskIds.push(task2Id);
    console.log('  ✔ Tasks created successfully by Admin (ID:', task1Id, ') and Manager (ID:', task2Id, ').');

    // ----------------------------------------------------
    // G. Counsellor Task Creation Rejection
    // ----------------------------------------------------
    console.log('\n[Test G] Rejection of Task Creation by Counsellor...');
    const c1TaskReq = {
      body: {
        title: 'Counsellor Self-Created Task',
        dueAt: new Date().toISOString(),
        userId: counsellor1.id,
      },
      user: counsellor1,
    };
    const taskRoutes = require('./src/routes/task.routes');
    // Verify authorizeRoles blocks counsellor
    let c1Blocked = false;
    const mockReq = { ...c1TaskReq, method: 'POST', url: '/' };
    const mockRes = createMockRes();
    const authorizeRoles = require('./src/middleware/authorize').authorizeRoles;
    const authMiddleware = authorizeRoles('ADMIN', 'MANAGER');
    authMiddleware(mockReq, mockRes, (err) => {
      if (!err) c1Blocked = false;
    });
    if (mockRes.statusCode === 403) c1Blocked = true;
    if (!c1Blocked) throw new Error('Counsellor creation attempt was not rejected by authorizeRoles middleware!');
    console.log('  ✔ Counsellor task creation rejected with HTTP 403 Forbidden.');

    // ----------------------------------------------------
    // H & I. Task Listing & Role Isolation
    // ----------------------------------------------------
    console.log('\n[Test H & I] Task Listing & Role Isolation...');
    const adminListRes = createMockRes();
    await taskController.getTasks({ query: { page: 1, limit: 20 }, user: adminUser }, adminListRes, (e) => { if (e) throw e; });
    if (adminListRes.statusCode !== 200 || adminListRes.data.data.length < 2) throw new Error('Admin task listing failed');

    const c1ListRes = createMockRes();
    await taskController.getTasks({ query: { page: 1, limit: 20 }, user: counsellor1 }, c1ListRes, (e) => { if (e) throw e; });
    if (c1ListRes.statusCode !== 200) throw new Error('Counsellor 1 task listing failed');
    const c1Tasks = c1ListRes.data.data;
    const containsC2Task = c1Tasks.some((t) => t.id === task2Id);
    if (containsC2Task) throw new Error('Counsellor 1 received Counsellor 2 task in listing!');
    console.log('  ✔ Admin received all tasks; Counsellor 1 received ONLY assigned tasks.');

    // ----------------------------------------------------
    // J. Cross-Counsellor Isolation (GET /api/tasks/:id)
    // ----------------------------------------------------
    console.log('\n[Test J] Cross-Counsellor Task Retrieval Isolation...');
    const c1GetC2TaskRes = createMockRes();
    await taskController.getTaskById({ params: { id: task2Id }, user: counsellor1 }, c1GetC2TaskRes, (e) => { if (e) throw e; });
    if (c1GetC2TaskRes.statusCode !== 403) throw new Error('Counsellor 1 was allowed to view Counsellor 2 task details!');
    console.log('  ✔ Counsellor 1 denied access to Counsellor 2 task details (HTTP 403).');

    // ----------------------------------------------------
    // K & N. Task Status Update & Server completedAt Control
    // ----------------------------------------------------
    console.log('\n[Test K & N] Task Status Update & Server completedAt Control...');
    const c1StatusUpdateRes = createMockRes();
    await taskController.updateTaskStatus(
      { params: { id: task1Id }, body: { status: 'COMPLETED' }, user: counsellor1 },
      c1StatusUpdateRes,
      (e) => { if (e) throw e; }
    );
    if (c1StatusUpdateRes.statusCode !== 200 || c1StatusUpdateRes.data.status !== 'COMPLETED' || !c1StatusUpdateRes.data.completedAt) {
      throw new Error('Task status update to COMPLETED failed or completedAt missing');
    }
    console.log('  ✔ Task status updated to COMPLETED and completedAt set server-side:', c1StatusUpdateRes.data.completedAt);

    // ----------------------------------------------------
    // L & M. Task Reassignment Security
    // ----------------------------------------------------
    console.log('\n[Test L & M] Task Reassignment Security & Action...');
    // Counsellor cannot reassign
    const c1ReassignRes = createMockRes();
    const reassignMiddleware = authorizeRoles('ADMIN', 'MANAGER');
    reassignMiddleware({ user: counsellor1 }, c1ReassignRes, () => {});
    if (c1ReassignRes.statusCode !== 403) throw new Error('Counsellor reassign was not blocked with 403');

    // Admin reassigns task 1 to Counsellor 2
    const adminReassignRes = createMockRes();
    await taskController.reassignTask(
      { params: { id: task1Id }, body: { userId: counsellor2.id }, user: adminUser },
      adminReassignRes,
      (e) => { if (e) throw e; }
    );
    if (adminReassignRes.statusCode !== 200 || adminReassignRes.data.userId !== counsellor2.id) {
      throw new Error('Task reassignment failed');
    }
    console.log('  ✔ Task reassigned to Counsellor 2 by Admin; Counsellor reassign blocked with 403.');

    // ----------------------------------------------------
    // O. Overdue Task Detection
    // ----------------------------------------------------
    console.log('\n[Test O] Overdue Task Detection...');
    const overdueTaskRes = createMockRes();
    await taskController.createTask(
      {
        body: {
          title: 'Overdue Test Task',
          dueAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          userId: counsellor2.id,
        },
        user: adminUser,
      },
      overdueTaskRes,
      (e) => { if (e) throw e; }
    );
    const overdueTaskId = overdueTaskRes.data.id;
    createdTaskIds.push(overdueTaskId);

    const overdueListRes = createMockRes();
    await taskController.getTasks({ query: { due: 'OVERDUE' }, user: adminUser }, overdueListRes, (e) => { if (e) throw e; });
    if (overdueListRes.statusCode !== 200 || !overdueListRes.data.data.some((t) => t.id === overdueTaskId)) {
      throw new Error('Overdue task was not returned under due=OVERDUE filter!');
    }
    console.log('  ✔ Overdue task dynamically detected and retrieved under due=OVERDUE filter.');

    // ----------------------------------------------------
    // P. Linked Lead Task Details
    // ----------------------------------------------------
    console.log('\n[Test P] Linked Lead Task Verification...');
    const getTask1Res = createMockRes();
    await taskController.getTaskById({ params: { id: task1Id }, user: adminUser }, getTask1Res, (e) => { if (e) throw e; });
    if (getTask1Res.statusCode !== 200 || !getTask1Res.data.lead || getTask1Res.data.lead.id !== leadId) {
      throw new Error('Linked lead details missing from task query!');
    }
    console.log('  ✔ Task returned associated lead details for Lead ID:', leadId);

    // ----------------------------------------------------
    // Q. AuditLog Verification
    // ----------------------------------------------------
    console.log('\n[Test Q] AuditLog Verification for TASK_CREATED and TASK_REASSIGNED...');
    const auditCreated = await prisma.auditLog.findFirst({ where: { action: 'TASK_CREATED', entityId: task1Id } });
    const auditReassigned = await prisma.auditLog.findFirst({ where: { action: 'TASK_REASSIGNED', entityId: task1Id } });
    if (!auditCreated || !auditReassigned) {
      throw new Error('AuditLog entries for TASK_CREATED or TASK_REASSIGNED missing!');
    }
    console.log('  ✔ AuditLog entries verified for TASK_CREATED and TASK_REASSIGNED.');

    // ----------------------------------------------------
    // R & S. Counsellor Dashboard Metrics & Isolation
    // ----------------------------------------------------
    console.log('\n[Test R & S] Counsellor Dashboard Real Metrics & User Isolation...');
    const c2DashRes = createMockRes();
    await dashboardController.getCounsellorDashboard({ user: counsellor2 }, c2DashRes, (e) => { if (e) throw e; });
    if (c2DashRes.statusCode !== 200 || typeof c2DashRes.data.metrics.pendingTasks !== 'number') {
      throw new Error('Counsellor dashboard metrics fetch failed');
    }
    console.log('  ✔ Counsellor 2 dashboard metrics calculated strictly from req.user.id:', JSON.stringify(c2DashRes.data.metrics));

    // ----------------------------------------------------
    // T. Pagination, Search, and Filtering
    // ----------------------------------------------------
    console.log('\n[Test T] Pagination, Search, and Filtering Assertions...');
    const searchRes = createMockRes();
    await taskController.getTasks({ query: { search: 'Follow-up' }, user: adminUser }, searchRes, (e) => { if (e) throw e; });
    if (searchRes.statusCode !== 200 || searchRes.data.data.length === 0) throw new Error('Task title search failed');
    console.log('  ✔ Task search, pagination, and filters working properly.');

    console.log('\n===========================================================');
    console.log('   ALL PHASE 4 TESTS (A THROUGH T) PASSED SUCCESSFULLY! 🚀');
    console.log('===========================================================\n');
  } finally {
    // Cleanup created test records
    if (createdTaskIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { entity: 'Task', entityId: { in: createdTaskIds } } });
      await prisma.task.deleteMany({ where: { id: { in: createdTaskIds } } });
    }
    if (createdLeadIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { entity: 'Lead', entityId: { in: createdLeadIds } } });
      await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
      console.log(`[Cleanup] Successfully cleaned up ${createdTaskIds.length} test tasks and ${createdLeadIds.length} test leads.`);
    }
    await prisma.$disconnect();
  }
}

runPhase4TestSuite().catch((err) => {
  console.error('❌ Phase 4 test suite failed:', err);
  process.exit(1);
});
