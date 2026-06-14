const mongoose = require('mongoose');
const settingSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', unique: true },
  company_name: { type: String, default: 'Trinetra Workforce' },
  timezone: { type: String, default: 'IST (UTC+5:30)' },
  auto_attendance: { type: Boolean, default: true },
  registry_lock: { type: Boolean, default: false },
  retention_period: { type: String, default: '365 Days' },
  notification_email: String,
  backup_frequency: { type: String, default: 'Daily' },
  security_2fa: { type: Boolean, default: false }
});
module.exports = mongoose.model('Setting', settingSchema);