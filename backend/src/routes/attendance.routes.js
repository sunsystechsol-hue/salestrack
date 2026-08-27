const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  heartbeat,
  logoutAttendance,
  getAttendance,
  getMyAttendance,
  getAttendanceById,
} = require('../controllers/attendance.controller');

const router = express.Router();

router.use(authenticateToken);

router.post('/heartbeat', heartbeat);
router.post('/logout', logoutAttendance);
router.get('/me', getMyAttendance);
router.get('/', getAttendance);
router.get('/:id', getAttendanceById);

module.exports = router;
