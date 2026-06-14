const express = require('express');
const router = express.Router();
const { getDashboardStats, createNote } = require('../controllers/dashboardController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/stats', authenticateToken, authorizeRole('admin'), getDashboardStats);
router.post('/notes', authenticateToken, authorizeRole('admin'), createNote);

module.exports = router;
