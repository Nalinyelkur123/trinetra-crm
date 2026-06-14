const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markMessageAsRead, getConversations, broadcastMessage } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, sendMessage);
router.get('/', authenticateToken, getMessages);
router.get('/conversations', authenticateToken, getConversations);
router.post('/broadcast', authenticateToken, broadcastMessage);
router.put('/:messageId/read', authenticateToken, markMessageAsRead);

module.exports = router;
