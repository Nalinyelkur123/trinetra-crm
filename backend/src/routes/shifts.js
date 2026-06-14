const express = require('express');
const router = express.Router();
const { createShift, bulkCreateShifts, getShifts, updateShift, deleteShift, getShiftConflicts } = require('../controllers/shiftController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole('admin'), createShift);
router.post('/bulk', authenticateToken, authorizeRole('admin'), bulkCreateShifts);
router.get('/', authenticateToken, getShifts);
router.get('/conflicts', authenticateToken, getShiftConflicts);
router.put('/:shiftId', authenticateToken, authorizeRole('admin'), updateShift);
router.delete('/:shiftId', authenticateToken, authorizeRole('admin'), deleteShift);

module.exports = router;
