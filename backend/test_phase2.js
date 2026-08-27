require('dotenv').config();
const prisma = require('./src/utils/prisma');
const authController = require('./src/controllers/auth.controller');
const leadController = require('./src/controllers/lead.controller');
const integrationController = require('./src/controllers/integration.controller');
const webhookAuth = require('./src/middleware/webhookAuth');
const { verifyToken } = require('./src/utils/jwt');

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

async function runFullPhase2TestSuite() {
  console.log('===========================================================');
  console.log('   PHASE 2 COMPREHENSIVE SUITE (ITEMS A THROUGH Q)');
  console.log('===========================================================\n');

  const createdLeadIds = [];
  const testResponseId = `resp_suite_${Date.now()}`;

  try {
    // ----------------------------------------------------
    // A. Health Endpoint Check
    // ----------------------------------------------------
    console.log('[Test A] GET /api/health...');
    const healthRoutes = require('./src/routes/health.routes');
    const healthRes = createMockRes();
    healthRoutes.stack[0].handle({ method: 'GET', url: '/api/health' }, healthRes, () => {});
    if (healthRes.statusCode !== 200 || healthRes.data.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(healthRes.data)}`);
    }
    console.log('  ✔ Health check returned HTTP 200 with status: ok');

    // ----------------------------------------------------
    // B. Authentication (ADMIN, MANAGER, COUNSELLOR)
    // ----------------------------------------------------
    console.log('\n[Test B] Authentication for ADMIN, MANAGER, COUNSELLOR...');
    const adminUser = await prisma.user.findUnique({ where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@kaushalsaathi.com' } });
    const managerUser = await prisma.user.findUnique({ where: { email: process.env.SEED_MANAGER_EMAIL || 'manager@kaushalsaathi.com' } });
    const counsellor1User = await prisma.user.findUnique({ where: { email: process.env.SEED_COUNSELLOR_EMAIL || 'counsellor@kaushalsaathi.com' } });
    const counsellor2User = await prisma.user.findUnique({ where: { email: 'counsellor2@kaushalsaathi.com' } });

    if (!adminUser || !managerUser || !counsellor1User || !counsellor2User) {
      throw new Error('Required seeded test accounts not found in database. Run seed first.');
    }

    const adminLoginRes = createMockRes();
    await authController.login({ body: { email: adminUser.email, password: process.env.SEED_ADMIN_PASSWORD } }, adminLoginRes, (e) => { if (e) throw e; });
    if (adminLoginRes.statusCode !== 200 || !adminLoginRes.data.token) throw new Error('Admin login failed');
    const adminTokenPayload = verifyToken(adminLoginRes.data.token);

    const managerLoginRes = createMockRes();
    await authController.login({ body: { email: managerUser.email, password: process.env.SEED_MANAGER_PASSWORD } }, managerLoginRes, (e) => { if (e) throw e; });
    if (managerLoginRes.statusCode !== 200 || !managerLoginRes.data.token) throw new Error('Manager login failed');

    const counsellorLoginRes = createMockRes();
    await authController.login({ body: { email: counsellor1User.email, password: process.env.SEED_COUNSELLOR_PASSWORD } }, counsellorLoginRes, (e) => { if (e) throw e; });
    if (counsellorLoginRes.statusCode !== 200 || !counsellorLoginRes.data.token) throw new Error('Counsellor login failed');

    console.log('  ✔ Admin, Manager, and Counsellor logins returned valid JWT tokens.');

    // ----------------------------------------------------
    // C. Lead Creation
    // ----------------------------------------------------
    console.log('\n[Test C] POST /api/leads (Lead Creation)...');
    const createReq = {
      body: {
        name: 'Phase 2 Test Prospect',
        phone: '9888111222',
        email: 'p2prospect@example.com',
        course: 'Python Full Stack',
        city: 'Hospet',
        formResponseId: testResponseId,
        notes: 'Initial enquiry during test suite',
      },
      user: adminUser,
    };
    const createRes = createMockRes();
    await leadController.createLead(createReq, createRes, (e) => { if (e) throw e; });
    if (createRes.statusCode !== 201 || !createRes.data.id) throw new Error(`Lead creation failed: ${JSON.stringify(createRes.data)}`);
    const testLeadId = createRes.data.id;
    createdLeadIds.push(testLeadId);
    console.log('  ✔ Created Lead ID in PostgreSQL:', testLeadId);

    // ----------------------------------------------------
    // D. Lead Listing & Pagination
    // ----------------------------------------------------
    console.log('\n[Test D] GET /api/leads (Pagination & Listing)...');
    const listReq = { query: { page: 1, limit: 20 }, user: adminUser };
    const listRes = createMockRes();
    await leadController.getLeads(listReq, listRes, (e) => { if (e) throw e; });
    if (listRes.statusCode !== 200 || !Array.isArray(listRes.data.data) || !listRes.data.pagination) {
      throw new Error(`Lead listing failed: ${JSON.stringify(listRes.data)}`);
    }
    const foundCreated = listRes.data.data.some((l) => l.id === testLeadId);
    if (!foundCreated) throw new Error('Created lead was not found in listing');
    console.log('  ✔ Lead listing returned page 1 with pagination total:', listRes.data.pagination.total);

    // ----------------------------------------------------
    // E. Search & Filtering
    // ----------------------------------------------------
    console.log('\n[Test E] Search & Filtering...');
    const searchReq = { query: { search: 'Phase 2 Test' }, user: adminUser };
    const searchRes = createMockRes();
    await leadController.getLeads(searchReq, searchRes, (e) => { if (e) throw e; });
    if (searchRes.statusCode !== 200 || searchRes.data.data.length === 0) throw new Error('Search failed');

    const filterReq = { query: { status: 'NEW' }, user: adminUser };
    const filterRes = createMockRes();
    await leadController.getLeads(filterReq, filterRes, (e) => { if (e) throw e; });
    if (filterRes.statusCode !== 200 || !filterRes.data.data.every((l) => l.status === 'NEW')) {
      throw new Error('Status filter failed');
    }
    console.log('  ✔ Search and status filtering verified.');

    // ----------------------------------------------------
    // F. Lead Details
    // ----------------------------------------------------
    console.log('\n[Test F] GET /api/leads/:id (Lead Details)...');
    const detailsReq = { params: { id: testLeadId }, user: adminUser };
    const detailsRes = createMockRes();
    await leadController.getLeadById(detailsReq, detailsRes, (e) => { if (e) throw e; });
    if (detailsRes.statusCode !== 200 || detailsRes.data.id !== testLeadId) throw new Error('Get lead details failed');
    console.log('  ✔ Retained lead details for ID:', detailsRes.data.id);

    // ----------------------------------------------------
    // G. Status Update
    // ----------------------------------------------------
    console.log('\n[Test G] PATCH /api/leads/:id/status (Status Update)...');
    const statusReq = { params: { id: testLeadId }, body: { status: 'CONTACTED' }, user: adminUser };
    const statusRes = createMockRes();
    await leadController.updateLeadStatus(statusReq, statusRes, (e) => { if (e) throw e; });
    if (statusRes.statusCode !== 200 || statusRes.data.status !== 'CONTACTED') throw new Error('Status update failed');
    console.log('  ✔ Updated Lead status to CONTACTED.');

    // ----------------------------------------------------
    // H. Assignment
    // ----------------------------------------------------
    console.log('\n[Test H] PATCH /api/leads/:id/assign (Assign to Counsellor 1)...');
    const assignReq = { params: { id: testLeadId }, body: { assignedToId: counsellor1User.id }, user: adminUser };
    const assignRes = createMockRes();
    await leadController.assignLead(assignReq, assignRes, (e) => { if (e) throw e; });
    if (assignRes.statusCode !== 200 || assignRes.data.assignedToId !== counsellor1User.id) throw new Error('Assign lead failed');
    console.log('  ✔ Lead assigned to Counsellor 1.');

    // ----------------------------------------------------
    // I. Audit Logging (LEAD_ASSIGNED)
    // ----------------------------------------------------
    console.log('\n[Test I] Audit Logging Verification...');
    const assignAudit = await prisma.auditLog.findFirst({
      where: { entityId: testLeadId, action: 'LEAD_ASSIGNED' },
    });
    if (!assignAudit) throw new Error('AuditLog entry for LEAD_ASSIGNED missing');
    console.log('  ✔ AuditLog entry found:', assignAudit.action, '-', assignAudit.details);

    // ----------------------------------------------------
    // J. Reassignment & Audit Logging (LEAD_REASSIGNED)
    // ----------------------------------------------------
    console.log('\n[Test J] PATCH /api/leads/:id/reassign (Reassign to Counsellor 2)...');
    const reassignReq = { params: { id: testLeadId }, body: { assignedToId: counsellor2User.id }, user: adminUser };
    const reassignRes = createMockRes();
    await leadController.reassignLead(reassignReq, reassignRes, (e) => { if (e) throw e; });
    if (reassignRes.statusCode !== 200 || reassignRes.data.assignedToId !== counsellor2User.id) throw new Error('Reassign lead failed');

    const reassignAudit = await prisma.auditLog.findFirst({
      where: { entityId: testLeadId, action: 'LEAD_REASSIGNED' },
    });
    if (!reassignAudit) throw new Error('AuditLog entry for LEAD_REASSIGNED missing');
    console.log('  ✔ Lead reassigned to Counsellor 2 and LEAD_REASSIGNED AuditLog recorded.');

    // ----------------------------------------------------
    // K. Counsellor Isolation
    // ----------------------------------------------------
    console.log('\n[Test K] Counsellor Role Isolation...');
    // Lead is assigned to Counsellor 2. Counsellor 1 attempts to fetch it:
    const c1Req = { params: { id: testLeadId }, user: counsellor1User };
    const c1Res = createMockRes();
    await leadController.getLeadById(c1Req, c1Res, (e) => { if (e) throw e; });
    if (c1Res.statusCode !== 403) throw new Error('Counsellor 1 was allowed to access Counsellor 2 lead!');

    // Counsellor 2 attempts to fetch it (own assigned lead):
    const c2Req = { params: { id: testLeadId }, user: counsellor2User };
    const c2Res = createMockRes();
    await leadController.getLeadById(c2Req, c2Res, (e) => { if (e) throw e; });
    if (c2Res.statusCode !== 200) throw new Error('Counsellor 2 could not access own assigned lead!');
    console.log('  ✔ Counsellor 1 denied (403); Counsellor 2 allowed (200).');

    // ----------------------------------------------------
    // L. Counsellor Authorization Boundaries
    // ----------------------------------------------------
    console.log('\n[Test L] Counsellor Authorization Boundaries...');
    const cCreateReq = { body: { name: 'Unauthorized Lead', phone: '9000000000' }, user: counsellor1User };
    let cCreateForbidden = false;
    const cCreateRes = { status(code) { if (code === 403) cCreateForbidden = true; return { json() {} }; } };
    const authorizeMiddleware = require('./src/middleware/authorize').authorizeRoles('ADMIN', 'MANAGER');
    authorizeMiddleware(cCreateReq, cCreateRes, () => {});
    if (!cCreateForbidden) throw new Error('Counsellor was allowed to create lead!');
    console.log('  ✔ Counsellor denied lead creation/assignment via authorizeRoles (403).');

    // ----------------------------------------------------
    // M. Google Form Webhook Authentication
    // ----------------------------------------------------
    console.log('\n[Test M] Webhook Authentication...');
    let unauthWebhook = false;
    webhookAuth.verifyWebhookSecret({ headers: {} }, {
      status(code) { if (code === 401) unauthWebhook = true; return { json() {} }; },
    }, () => {});
    if (!unauthWebhook) throw new Error('Webhook allowed request without secret header!');
    console.log('  ✔ Missing X-Webhook-Secret returned HTTP 401 Unauthorized.');

    // ----------------------------------------------------
    // N. Google Form Webhook Ingestion
    // ----------------------------------------------------
    console.log('\n[Test N] Webhook Ingestion...');
    const webhookRespId = `webhook_resp_${Date.now()}`;
    const webhookPayload = {
      formResponseId: webhookRespId,
      name: 'Webhook Prospect',
      phone: '9666555444',
      email: 'webhook@example.com',
      course: 'Java Full Stack',
      city: 'Hospet',
    };
    const webhookReq = { body: webhookPayload };
    const webhookRes = createMockRes();
    await integrationController.handleGoogleFormWebhook(webhookReq, webhookRes, (e) => { if (e) throw e; });
    if (webhookRes.statusCode !== 201 || !webhookRes.data.success || !webhookRes.data.leadId) {
      throw new Error(`Webhook ingestion failed: ${JSON.stringify(webhookRes.data)}`);
    }
    const webhookLeadId = webhookRes.data.leadId;
    createdLeadIds.push(webhookLeadId);

    const checkWebhookLead = await prisma.lead.findUnique({ where: { id: webhookLeadId } });
    if (checkWebhookLead.source !== 'Google Form' || checkWebhookLead.status !== 'NEW') {
      throw new Error('Webhook lead source/status incorrect');
    }
    console.log('  ✔ Webhook ingested lead with source="Google Form" and status="NEW".');

    // ----------------------------------------------------
    // O. Google Form Webhook Idempotency
    // ----------------------------------------------------
    console.log('\n[Test O] Webhook Idempotency...');
    const dupRes = createMockRes();
    await integrationController.handleGoogleFormWebhook(webhookReq, dupRes, (e) => { if (e) throw e; });
    if (dupRes.statusCode !== 200 || !dupRes.data.duplicate) {
      throw new Error(`Idempotency check failed: ${JSON.stringify(dupRes.data)}`);
    }
    console.log('  ✔ Duplicate submission returned duplicate=true without creating second lead.');

    // ----------------------------------------------------
    // P. Invalid Webhook Payload
    // ----------------------------------------------------
    console.log('\n[Test P] Invalid Webhook Payload Validation...');
    const invalidWebhookReq = { body: { name: 'Missing Phone' } };
    const invalidWebhookRes = createMockRes();
    await integrationController.handleGoogleFormWebhook(invalidWebhookReq, invalidWebhookRes, (e) => { if (e) throw e; });
    if (invalidWebhookRes.statusCode !== 400 || invalidWebhookRes.data.success !== false) {
      throw new Error('Invalid webhook payload was not rejected!');
    }
    console.log('  ✔ Missing required fields returned HTTP 400 Bad Request.');

    // ----------------------------------------------------
    // Q. Database Integrity Check
    // ----------------------------------------------------
    console.log('\n[Test Q] Database Integrity Check...');
    const [userCount, attendanceCount, leadCount, callLogCount, taskCount, auditCount] = await Promise.all([
      prisma.user.count(),
      prisma.attendance.count(),
      prisma.lead.count(),
      prisma.callLog.count(),
      prisma.task.count(),
      prisma.auditLog.count(),
    ]);
    if (userCount === 0 || auditCount === 0) throw new Error('Database tables empty or invalid');
    console.log(`  ✔ Phase 1 & 2 models intact. Users: ${userCount}, Leads: ${leadCount}, AuditLogs: ${auditCount}`);

    console.log('\n===========================================================');
    console.log('   ALL TESTS (A THROUGH Q) PASSED SUCCESSFULLY! 🚀');
    console.log('===========================================================\n');
  } finally {
    // Clean up created test leads and test audit logs only
    if (createdLeadIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { entityId: { in: createdLeadIds } } });
      await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
      console.log(`[Cleanup] Successfully removed ${createdLeadIds.length} test leads and audit records.`);
    }
    await prisma.$disconnect();
  }
}

runFullPhase2TestSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
