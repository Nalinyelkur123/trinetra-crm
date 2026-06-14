const mongoose = require('mongoose');
const performanceSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: Number,
  year: Number,
  total_days: Number,
  present_days: Number,
  absent_days: Number,
  late_days: Number,
  attendance_percentage: Number,
  punctuality_score: Number,
  tasks_completed: Number,
  performance_rating: String,
  notes: String
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
performanceSchema.index({ worker_id: 1, month: 1, year: 1 }, { unique: true });
module.exports = mongoose.model('Performance', performanceSchema);