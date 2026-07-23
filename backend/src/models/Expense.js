const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  category: {
    type: String,
    enum: ['Travel', 'Food', 'Accommodation', 'Fuel', 'Office Supplies', 'Training'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  merchantName: {
    type: String,
    required: true
  },
  expenseDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  notes: {
    type: String
  },
  receiptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receipt'
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under_Review', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  riskScore: {
    type: Number,
    default: 0
  },
  fraudFlags: [{
    type: String
  }],
  approvalStage: {
    type: String,
    enum: ['Employee', 'Manager', 'HR', 'Finance', 'Completed'],
    default: 'Employee'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
