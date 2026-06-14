const { db } = require('../config/db');

const getNotifications = (req, res) => {
  try {
    const user_id = req.user.role === 'admin' && req.params.user_id ? req.params.user_id : req.user.id;
    const { unread_only } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [user_id];
    
    if (unread_only === 'true') {
      query += ' AND is_read = 0';
    }
    
    query += ' ORDER BY created_at DESC LIMIT 50';
    const notifications = db.prepare(query).all(...params);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAsRead = (req, res) => {
  const { notificationId } = req.params;
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notificationId);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAllAsRead = (req, res) => {
  const user_id = req.user.id;
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(user_id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteNotification = (req, res) => {
  const { notificationId } = req.params;
  try {
    db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUnreadCount = (req, res) => {
  const user_id = req.user.id;
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user_id);
    res.json({ unread_count: result.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendNotification = (user_id, type, title, message, action_url = null) => {
  try {
    db.prepare('INSERT INTO notifications (user_id, type, title, message, action_url) VALUES (?, ?, ?, ?, ?)')
      .run(user_id, type, title, message, action_url);
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
};

module.exports = { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  getUnreadCount, 
  sendNotification 
};
