const mongoose = require('mongoose');
const payrollSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  base_salary: Number,
  overtime: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  net_pay: Number,
  status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
  payslip_url: String
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Payroll', payrollSchema);