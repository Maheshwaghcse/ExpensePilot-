const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  domain: {
    type: String,
    trim: true,
    unique: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['Trial', 'Active', 'Suspended'],
    default: 'Trial'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
