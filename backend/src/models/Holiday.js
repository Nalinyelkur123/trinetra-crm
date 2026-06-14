const mongoose = require('mongoose');
const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  holiday_date: { type: Date, required: true },
  category: String,
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Holiday', holidaySchema);