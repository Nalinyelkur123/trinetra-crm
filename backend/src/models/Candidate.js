const mongoose = require('mongoose');
const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  job_role: String,
  status: { type: String, default: 'Screening' },
  applied_date: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Candidate', candidateSchema);