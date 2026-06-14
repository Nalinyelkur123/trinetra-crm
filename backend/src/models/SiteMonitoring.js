const mongoose = require('mongoose');
const siteMonitoringSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment', required: true },
  supervisor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supervisor_notes: String,
  worker_count: Number,
  safety_score: Number,
  quality_score: Number,
  monitoring_date: Date,
  latitude: Number,
  longitude: Number,
  client_feedback: String
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('SiteMonitoring', siteMonitoringSchema);