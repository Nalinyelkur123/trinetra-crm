const express = require('express');
const { getPayroll, generatePayroll, updatePayrollStatus } = require('../controllers/payrollController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, authorizeRole('admin'), getPayroll);
router.post('/generate', authenticateToken, authorizeRole('admin'), generatePayroll);
router.patch('/:id/status', authenticateToken, authorizeRole('admin'), updatePayrollStatus);

module.exports = router;
