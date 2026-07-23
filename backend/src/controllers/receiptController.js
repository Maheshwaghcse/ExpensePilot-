const Receipt = require('../models/Receipt');
const Expense = require('../models/Expense');
const { queueReceiptProcessing } = require('../queues/receiptQueue');

const uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No receipt file provided' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    // Create database Receipt entry
    const receipt = await Receipt.create({
      companyId: req.user.companyId,
      uploadedBy: req.user.id,
      fileUrl,
      fileType: req.file.mimetype,
      ocrStatus: 'Pending'
    });

    // Pre-create Draft Expense
    const { category, notes } = req.body;
    
    const expense = await Expense.create({
      companyId: req.user.companyId,
      employeeId: req.user.id,
      departmentId: req.user.departmentId || undefined,
      category: category || 'Travel', // default fallback
      amount: 0, // autofilled by OCR
      merchantName: 'Pending OCR Processing', // autofilled by OCR
      notes: notes || '',
      receiptId: receipt._id,
      status: 'Draft',
      approvalStage: 'Employee'
    });

    // Dispatch background BullMQ job
    await queueReceiptProcessing({
      receiptId: receipt._id,
      fileUrl,
      companyId: req.user.companyId,
      expenseId: expense._id
    });

    res.status(202).json({
      message: 'Receipt successfully uploaded and queued for data extraction',
      receipt,
      expense
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReceiptStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findOne({ _id: id, companyId: req.user.companyId });
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadReceipt,
  getReceiptStatus
};
