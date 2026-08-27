const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const { getCounsellors } = require('../controllers/user.controller');

const router = express.Router();

router.use(authenticateToken);
router.get('/counsellors', authorizeRoles('ADMIN', 'MANAGER'), getCounsellors);

module.exports = router;
