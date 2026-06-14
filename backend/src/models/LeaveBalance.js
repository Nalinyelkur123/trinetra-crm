const mongoose = require('mongoose');
const leaveBalanceSchema = new mongoose.Schema({
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  year: Number,
  casual_leaves: { type: Number, default: 12 },
  sick_leaves: { type: Number, default: 8 },
  annual_leaves: { type: Number, default: 20 },
  leaves_used_casual: { type: Number, default: 0 },
  leaves_used_sick: { type: Number, default: 0 },
  leaves_used_annual: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
leaveBalanceSchema.index({ worker_id: 1, year: 1 }, { unique: true });
module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);