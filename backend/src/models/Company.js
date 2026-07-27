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
    trim: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['Trial', 'Active', 'Suspended'],
    default: 'Trial'
  }
}, {
  timestamps: true
});

const Company = mongoose.model('Company', companySchema);

// Safely drop legacy unique index on domain if it exists in MongoDB
Company.collection.dropIndex('domain_1').catch(() => {
  // Ignore error if index doesn't exist
});

module.exports = Company;
