const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  reassignTask,
} = require('../controllers/task.controller');

const router = express.Router();

router.use(authenticateToken);

router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.patch('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/reassign', authorizeRoles('ADMIN', 'MANAGER'), reassignTask);

module.exports = router;
