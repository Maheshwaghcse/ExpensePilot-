const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  rules: {
    maxMealAmount: { type: Number, default: 0 }, // 0 means no limit
    maxTravelAmount: { type: Number, default: 0 },
    dailyLimit: { type: Number, default: 0 },
    monthlyLimit: { type: Number, default: 0 },
    allowedVendors: [{ type: String, trim: true }],
    requiresPreApproval: { type: Boolean, default: false }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Policy', policySchema);
