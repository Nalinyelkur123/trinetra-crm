const express = require('express');
const router = express.Router();
const { markAttendance, getDailyAttendance } = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, markAttendance);
router.get('/', authenticateToken, getDailyAttendance);

module.exports = router;
