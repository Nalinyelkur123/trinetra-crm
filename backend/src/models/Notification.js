const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: String,
  action_url: String,
  is_read: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Notification', notificationSchema);