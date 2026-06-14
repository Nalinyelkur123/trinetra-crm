const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount } = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/count/:user_id', authenticateToken, getUnreadCount);
router.put('/mark-all-read', authenticateToken, markAllAsRead);
router.get('/:user_id', authenticateToken, getNotifications);
router.put('/:notificationId/read', authenticateToken, markAsRead);
router.delete('/:notificationId', authenticateToken, deleteNotification);

module.exports = router;
