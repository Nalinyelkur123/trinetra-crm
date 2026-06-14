const mongoose = require('mongoose');
const noteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  priority: { type: String, default: 'normal' },
  is_completed: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Note', noteSchema);