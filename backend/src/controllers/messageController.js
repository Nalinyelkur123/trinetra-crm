const { Message, User } = require('../models');

const sendMessage = async (req, res) => {
  const { receiver_id, group_id, message_type, content } = req.body;
  const sender_id = req.user.id;
  
  try {
    const message = await Message.create({
      sender_id, receiver_id: receiver_id || null, group_id: group_id || null, message_type: message_type || 'direct', content
    });
    res.status(201).json({ message: 'Message sent', messageId: message._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversation_with, group_id } = req.query;
    const user_id = req.user.id;
    
    let filter = {};

    if (group_id) {
      filter = { group_id };
    } else if (conversation_with) {
      filter = {
        $or: [
          { sender_id: user_id, receiver_id: conversation_with },
          { sender_id: conversation_with, receiver_id: user_id }
        ]
      };
    } else {
      filter = {
        $or: [{ sender_id: user_id }, { receiver_id: user_id }]
      };
    }
    
    const messages = await Message.find(filter).sort({ created_at: -1 }).limit(100).lean();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markMessageAsRead = async (req, res) => {
  const { messageId } = req.params;
  try {
    await Message.findByIdAndUpdate(messageId, { is_read: true });
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getConversations = async (req, res) => {
  const user_id = req.user.id;
  try {
    const messages = await Message.find({
      $or: [{ sender_id: user_id }, { receiver_id: user_id }]
    }).lean();

    const conversationMap = new Map();

    messages.forEach(m => {
      const otherUserId = m.sender_id?.toString() === user_id.toString() ? m.receiver_id?.toString() : m.sender_id?.toString();
      if (!otherUserId) return; // skip group messages for direct conversations list logic if they don't fit
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          other_user_id: otherUserId,
          last_message_time: m.created_at,
          unread_count: 0
        });
      }
      
      const conv = conversationMap.get(otherUserId);
      if (new Date(m.created_at) > new Date(conv.last_message_time)) {
        conv.last_message_time = m.created_at;
      }
      
      if (!m.is_read && m.receiver_id?.toString() === user_id.toString()) {
        conv.unread_count += 1;
      }
    });

    const conversations = Array.from(conversationMap.values()).sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));
    
    // Populate names
    const formatted = await Promise.all(conversations.map(async (c) => {
      const user = await User.findById(c.other_user_id).lean();
      return {
        ...c,
        other_user_name: user?.name
      };
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const broadcastMessage = async (req, res) => {
  const { message_type, content } = req.body;
  const from_user_id = req.user.id;
  try {
    const targetRole = message_type === 'admin_announcement' ? 'worker' : 'admin';
    const users = await User.find({ role: targetRole }).lean();
    
    const messages = users.map(user => ({
      sender_id: from_user_id,
      receiver_id: user._id,
      message_type,
      content
    }));

    if (messages.length > 0) {
      await Message.insertMany(messages);
    }
    
    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendMessage, getMessages, markMessageAsRead, getConversations, broadcastMessage };
