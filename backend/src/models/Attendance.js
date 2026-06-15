const mongoose = require('mongoose');
const attendanceSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'half-day', 'late'], required: true },
  check_in_time: Date,
  check_out_time: Date,
  location: String,
  shift_type: { type: String, default: 'General' },
  overtime_hours: { type: Number, default: 0 },
  overtime_status: { type: String, default: 'pending' }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
attendanceSchema.index({ worker_id: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('Attendance', attendanceSchema);