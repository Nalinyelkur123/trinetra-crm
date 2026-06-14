const { db } = require('../config/db');

const sendMessage = (req, res) => {
  const { receiver_id, group_id, message_type, content } = req.body;
  const sender_id = req.user.id;
  
  try {
    const stmt = db.prepare('INSERT INTO messages (sender_id, receiver_id, group_id, message_type, content) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(sender_id, receiver_id, group_id, message_type, content);
    res.status(201).json({ message: 'Message sent', messageId: info.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getMessages = (req, res) => {
  try {
    const { conversation_with, group_id } = req.query;
    const user_id = req.user.id;
    let query = 'SELECT * FROM messages WHERE (sender_id = ? OR receiver_id = ?)';
    const params = [user_id, user_id];
    
    if (conversation_with) {
      query += ' AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))';
      params.push(conversation_with, user_id, user_id, conversation_with);
    }
    if (group_id) {
      query += ' AND group_id = ?';
      params.push(group_id);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100';
    const messages = db.prepare(query).all(...params);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markMessageAsRead = (req, res) => {
  const { messageId } = req.params;
  try {
    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(messageId);
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getConversations = (req, res) => {
  const user_id = req.user.id;
  try {
    const conversations = db.prepare(`
      SELECT DISTINCT 
        CASE 
          WHEN sender_id = ? THEN receiver_id
          ELSE sender_id
        END as other_user_id,
        (SELECT name FROM users WHERE id = other_user_id) as other_user_name,
        MAX(created_at) as last_message_time,
        SUM(CASE WHEN is_read = 0 AND receiver_id = ? THEN 1 ELSE 0 END) as unread_count
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY other_user_id
      ORDER BY last_message_time DESC
    `).all(user_id, user_id, user_id, user_id);
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const broadcastMessage = (req, res) => {
  const { message_type, content } = req.body;
  const from_user_id = req.user.id;
  try {
    // Get all users with specific role
    const users = db.prepare('SELECT id FROM users WHERE role = ?').all(message_type === 'admin_announcement' ? 'worker' : 'admin');
    
    users.forEach(user => {
      db.prepare('INSERT INTO messages (sender_id, receiver_id, message_type, content) VALUES (?, ?, ?, ?)')
        .run(from_user_id, user.id, message_type, content);
    });
    
    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendMessage, getMessages, markMessageAsRead, getConversations, broadcastMessage };
