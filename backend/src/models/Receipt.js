const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  ocrStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed'],
    default: 'Pending'
  },
  extractedData: {
    amount: Number,
    currency: { type: String, default: 'USD' },
    merchantName: String,
    date: Date,
    category: String,
    rawText: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Receipt', receiptSchema);
