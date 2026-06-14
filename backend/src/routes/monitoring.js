const express = require('express');
const router = express.Router();
const { createSiteMonitoring, getSiteMonitoring, getSiteQualityReport } = require('../controllers/siteMonitoringController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createSiteMonitoring);
router.get('/', authenticateToken, getSiteMonitoring);
router.get('/report/quality', authenticateToken, getSiteQualityReport);

module.exports = router;
