const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  target_type: String,
  target_id: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('AuditLog', auditLogSchema);