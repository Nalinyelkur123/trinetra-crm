const mongoose = require('mongoose');
const shiftSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment' },
  shift_date: { type: Date, required: true },
  shift_type: { type: String, default: 'General' },
  start_time: String,
  end_time: String,
  status: { type: String, default: 'scheduled' },
  notes: String
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Shift', shiftSchema);