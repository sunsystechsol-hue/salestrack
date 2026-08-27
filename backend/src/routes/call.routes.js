const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createCall, getCalls, getCallById } = require('../controllers/call.controller');

const router = express.Router();

router.use(authenticateToken);

router.post('/', createCall);
router.get('/', getCalls);
router.get('/:id', getCallById);

module.exports = router;
