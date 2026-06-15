const mongoose = require('mongoose');
const documentSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  file_url: { type: String, required: true },
  status: { type: String, default: 'pending' },
  expiry_date: Date
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Document', documentSchema);