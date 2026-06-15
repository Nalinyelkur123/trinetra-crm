const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

const sendMessage = async (req, res) => {
  const { receiver_id, group_id, message_type, content } = req.body;
  const sender_id = req.user.id;

  try {
    const message = new Message({
      sender_id,
      receiver_id: receiver_id || undefined,
      group_id: group_id || undefined,
      message_type,
      content
    });
    await message.save();
    res.status(201).json({ message: 'Message sent', messageId: message._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversation_with, group_id } = req.query;
    const user_id = req.user.id;
    let query = {};

    if (group_id) {
      query.group_id = group_id;
    } else if (conversation_with) {
      query.$or = [
        { sender_id: user_id, receiver_id: conversation_with },
        { sender_id: conversation_with, receiver_id: user_id }
      ];
    } else {
      query.$or = [{ sender_id: user_id }, { receiver_id: user_id }];
    }

    const messages = await Message.find(query)
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    res.json(messages.map(m => ({ ...m, id: m._id })));
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
    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender_id: new mongoose.Types.ObjectId(user_id) }, { receiver_id: new mongoose.Types.ObjectId(user_id) }] } },
      { $group: {
          _id: { $cond: [{ $eq: ["$sender_id", new mongoose.Types.ObjectId(user_id)] }, "$receiver_id", "$sender_id"] },
          last_message_time: { $max: "$created_at" },
          unread_count: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$is_read", false] }, { $eq: ["$receiver_id", new mongoose.Types.ObjectId(user_id)] }] },
                1,
                0
              ]
            }
          }
      } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: "$user" },
      { $project: {
          other_user_id: "$_id",
          other_user_name: "$user.name",
          last_message_time: 1,
          unread_count: 1
      } },
      { $sort: { last_message_time: -1 } }
    ]);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const broadcastMessage = async (req, res) => {
  const { message_type, content } = req.body;
  const from_user_id = req.user.id;
  try {
    const users = await User.find({ role: message_type === 'admin_announcement' ? 'worker' : 'admin' }).lean();

    const messages = users.map(user => ({
      sender_id: from_user_id,
      receiver_id: user._id,
      message_type,
      content
    }));

    await Message.insertMany(messages);

    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendMessage, getMessages, markMessageAsRead, getConversations, broadcastMessage };
