const mongoose = require('mongoose');

const approvalHistorySchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    required: true
  },
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roleAtTime: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['Approve', 'Reject', 'Request_More_Info'],
    required: true
  },
  comments: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ApprovalHistory', approvalHistorySchema);
