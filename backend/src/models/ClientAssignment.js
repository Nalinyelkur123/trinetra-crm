const mongoose = require('mongoose');
const clientAssignmentSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  name: { type: String, required: true },
  description: String,
  location: String,
  manager_name: String,
  contact_phone: String,
  start_date: Date,
  end_date: Date,
  shift_start: String,
  shift_end: String,
  working_hours: Number,
  status: { type: String, default: 'On-track' },
  progress: { type: Number, default: 0 },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('ClientAssignment', clientAssignmentSchema);