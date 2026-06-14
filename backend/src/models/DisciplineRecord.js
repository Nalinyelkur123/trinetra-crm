const mongoose = require('mongoose');
const disciplineRecordSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  record_date: { type: Date, required: true },
  category: { type: String, required: true },
  severity: { type: String, default: 'warning' },
  notes: String,
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('DisciplineRecord', disciplineRecordSchema);