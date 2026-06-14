const express = require('express');
const router = express.Router();
const { createTask, getTasks, updateTaskStatus, deleteTask, getTaskAnalytics } = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createTask);
router.get('/', authenticateToken, getTasks);
router.get('/analytics', authenticateToken, getTaskAnalytics);
router.put('/:taskId/status', authenticateToken, updateTaskStatus);
router.delete('/:taskId', authenticateToken, deleteTask);

module.exports = router;
