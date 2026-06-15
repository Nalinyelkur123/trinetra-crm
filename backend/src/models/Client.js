const mongoose = require('mongoose');
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  contact_person: String,
  address: String,
  contract_terms: String,
  billing_rate: Number,
  gst_number: String,
  agreement_start: Date,
  agreement_end: Date,
  payment_terms: String,
  status: { type: String, default: 'active' },
  shift_start: String,
  shift_end: String,
  working_hours: Number,
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Client', clientSchema);