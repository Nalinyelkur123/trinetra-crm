const express = require('express');
const router = express.Router();
const {
  requestLeave, getLeaves, approveLeave, rejectLeave, getLeaveBalance,
  getHolidays, createHoliday, bulkReviewLeaves
} = require('../controllers/leaveController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, requestLeave);
router.get('/', authenticateToken, getLeaves);
router.get('/holidays', authenticateToken, getHolidays);
router.post('/holidays', authenticateToken, authorizeRole('admin'), createHoliday);
router.put('/bulk-review', authenticateToken, authorizeRole('admin'), bulkReviewLeaves);
router.put('/:leaveId/approve', authenticateToken, authorizeRole('admin'), approveLeave);
router.put('/:leaveId/reject', authenticateToken, authorizeRole('admin'), rejectLeave);
router.get('/balance/:worker_id', authenticateToken, getLeaveBalance);

module.exports = router;
