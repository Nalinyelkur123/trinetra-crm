const mongoose = require('mongoose');
const expenseSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAssignment' },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: String,
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Expense', expenseSchema);