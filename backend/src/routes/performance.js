const express = require('express');
const router = express.Router();
const {
  calculatePerformance, getPerformance, getWorkerRankings,
  addDisciplineRecord, getDisciplineRecords
} = require('../controllers/performanceController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/calculate', authenticateToken, authorizeRole('admin'), calculatePerformance);
router.get('/', authenticateToken, getPerformance);
router.get('/rankings/monthly', authenticateToken, getWorkerRankings);
router.get('/discipline', authenticateToken, authorizeRole('admin'), getDisciplineRecords);
router.post('/discipline', authenticateToken, authorizeRole('admin'), addDisciplineRecord);

module.exports = router;
