const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const user_id = req.user.role === 'admin' && req.params.user_id ? req.params.user_id : req.user.id;
    const { unread_only } = req.query;

    let query = { user_id };
    if (unread_only === 'true') {
      query.is_read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    res.json(notifications.map(n => ({ ...n, id: n._id })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  try {
    await Notification.findByIdAndUpdate(notificationId, { is_read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  const user_id = req.user.id;
  try {
    await Notification.updateMany({ user_id, is_read: false }, { is_read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;
  try {
    await Notification.findByIdAndDelete(notificationId);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  const user_id = req.user.id;
  try {
    const count = await Notification.countDocuments({ user_id, is_read: false });
    res.json({ unread_count: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendNotification = async (user_id, type, title, message, action_url = null) => {
  try {
    await Notification.create({ user_id, type, title, message, action_url });
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
