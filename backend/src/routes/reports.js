const express = require('express');
const router = express.Router();
const { getReportStats, getReportDetail } = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, getReportStats);
router.get('/detail/:type', authenticateToken, getReportDetail);

module.exports = router;
