const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  reassignLead,
} = require('../controllers/lead.controller');

const router = express.Router();

// All lead routes require JWT authentication
router.use(authenticateToken);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createLead);
router.patch('/:id', updateLead);
router.patch('/:id/status', updateLeadStatus);
router.patch('/:id/assign', authorizeRoles('ADMIN', 'MANAGER'), assignLead);
router.patch('/:id/reassign', authorizeRoles('ADMIN', 'MANAGER'), reassignLead);

module.exports = router;
