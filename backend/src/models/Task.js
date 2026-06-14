const mongoose = require('mongoose');
const taskSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'pending' },
  start_date: Date,
  due_date: Date,
  completion_date: Date,
  assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Task', taskSchema);