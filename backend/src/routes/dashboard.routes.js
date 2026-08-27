const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getCounsellorDashboard } = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(authenticateToken);

router.get('/counsellor', getCounsellorDashboard);

module.exports = router;
