const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  details: String
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
module.exports = mongoose.model('Company', companySchema);