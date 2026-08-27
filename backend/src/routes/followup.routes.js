const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getFollowUps, completeFollowUp } = require('../controllers/followup.controller');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getFollowUps);
router.patch('/:id/complete', completeFollowUp);

module.exports = router;
