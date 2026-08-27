const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const {
  getManagementSummary,
  getCounsellorPerformance,
  getCallReport,
  getLeadStatusReport,
  getAttendanceReport,
  getFollowupReport,
  getTaskReport,
  exportReportCSV,
} = require('../controllers/report.controller');

const router = express.Router();

// Require JWT authentication and ADMIN / MANAGER authorization
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'MANAGER'));

router.get('/management/summary', getManagementSummary);
router.get('/management/performance', getCounsellorPerformance);
router.get('/management/calls', getCallReport);
router.get('/management/leads', getLeadStatusReport);
router.get('/management/attendance', getAttendanceReport);
router.get('/management/followups', getFollowupReport);
router.get('/management/tasks', getTaskReport);
router.get('/management/export', exportReportCSV);

module.exports = router;
