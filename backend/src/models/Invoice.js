const mongoose = require('mongoose');
const invoiceSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment' },
  amount: { type: Number, required: true },
  gst_amount: Number,
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'pending' },
  issue_date: { type: Date, default: Date.now },
  due_date: Date,
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Invoice', invoiceSchema);