const Receipt = require('../models/Receipt');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { parseReceipt } = require('./ocrService');
const { detectFraud } = require('./fraudService');

const processReceiptData = async ({ receiptId, fileUrl, companyId, expenseId }) => {
  console.log(`[Processor] Processing Receipt: ${receiptId} for Expense: ${expenseId}`);
  
  try {
    // 1. Update Receipt Status to Processing
    await Receipt.findByIdAndUpdate(receiptId, { ocrStatus: 'Processing' });

    // 2. Call OCR Service
    const parsedData = await parseReceipt(fileUrl);
    console.log(`[Processor] OCR Parse Completed for ${receiptId}`, parsedData);

    // 3. Save Extracted Data to Receipt
    await Receipt.findByIdAndUpdate(
      receiptId,
      {
        ocrStatus: 'Completed',
        extractedData: parsedData
      }
    );

    // 4. Retrieve and Update Linked Expense
    const expense = await Expense.findById(expenseId);
    if (expense) {
      if (expense.status === 'Draft') {
        expense.amount = parsedData.amount;
        expense.merchantName = parsedData.merchantName;
        expense.category = parsedData.category || expense.category;
        expense.expenseDate = parsedData.date || expense.expenseDate;
        expense.status = 'Submitted';
        expense.approvalStage = 'Manager';
      }

      // 5. Run Fraud Engine checks
      const fraudResult = await detectFraud(expense, parsedData);
      expense.riskScore = fraudResult.riskScore;
      expense.fraudFlags = fraudResult.fraudFlags;

      await expense.save();
      console.log(`[Processor] Fraud audit completed. Risk Score: ${expense.riskScore}%`);

      // 6. Create Notification for the Employee
      await Notification.create({
        userId: expense.employeeId,
        companyId,
        title: 'Receipt Processed Successfully',
        message: `Your receipt for $${expense.amount} at ${expense.merchantName} has been processed. Risk Score: ${expense.riskScore}%.`,
        type: expense.riskScore >= 70 ? 'Alert' : (expense.riskScore >= 40 ? 'Warning' : 'Info')
      });

      // 7. Notify Department Manager
      const employee = await User.findById(expense.employeeId).populate('departmentId');
      if (employee && employee.departmentId && employee.departmentId.managerId) {
        await Notification.create({
          userId: employee.departmentId.managerId,
          companyId,
          title: 'New Expense Claim Pending Approval',
          message: `${employee.name} submitted an expense of $${expense.amount} at ${employee.departmentId.managerId}.`,
          type: expense.riskScore >= 40 ? 'Warning' : 'Info'
        });
      }
    }
  } catch (err) {
    console.error(`[Processor] Processing failed for receipt ${receiptId}: ${err.message}`);
    await Receipt.findByIdAndUpdate(receiptId, { ocrStatus: 'Failed' });
    
    // Notify employee of failure
    const receiptObj = await Receipt.findById(receiptId);
    if (receiptObj) {
      await Notification.create({
        userId: receiptObj.uploadedBy,
        companyId,
        title: 'Receipt Processing Failed',
        message: 'We were unable to parse your uploaded receipt image. Please verify file quality and try again.',
        type: 'Alert'
      });
    }
  }
};

module.exports = {
  processReceiptData
};
