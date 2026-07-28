const Expense = require('../models/Expense');
const ApprovalHistory = require('../models/ApprovalHistory');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { detectFraud } = require('../services/fraudService');

// Get all expenses in the company (Supports pagination, filtering, searching)
const getExpenses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      status, 
      employeeId, 
      departmentId, 
      search = '',
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;

    const query = { ...req.tenantFilter };

    if (category) query.category = category;
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    if (departmentId) query.departmentId = departmentId;

    if (search) {
      query.merchantName = { $regex: search, $options: 'i' };
    }

    // Role-based scoping: Employees should only see their own expenses
    if (req.user.role === 'Employee') {
      query.employeeId = req.user.id;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const expenses = await Expense.find(query)
      .populate('employeeId', 'name email')
      .populate('departmentId', 'name')
      .populate('receiptId')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single expense
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate('employeeId', 'name email')
      .populate('departmentId', 'name')
      .populate('receiptId');

    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    
    // Role scope check
    const empIdStr = expense.employeeId?._id?.toString() || expense.employeeId?.toString();
    if (req.user.role === 'Employee' && empIdStr !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Cannot access another employee\'s claim' });
    }

    const history = await ApprovalHistory.find({ expenseId: expense._id }).populate('approverId', 'name email role');

    res.json({ expense, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a claim manually (without or with an optional receipt)
const createManualExpense = async (req, res) => {
  try {
    if (req.user.role === 'Auditor') {
      return res.status(403).json({ error: 'Financial Auditors conduct system audits and cannot create personal expense claims.' });
    }

    const { category, amount, currency, merchantName, expenseDate, notes, receiptId } = req.body;

    const user = await User.findById(req.user.id);

    const expense = new Expense({
      companyId: req.user.companyId,
      employeeId: req.user.id,
      departmentId: user.departmentId || undefined,
      category,
      amount: parseFloat(amount),
      currency: currency || 'INR',
      merchantName,
      expenseDate: expenseDate || new Date(),
      notes,
      receiptId: receiptId || undefined,
      status: 'Submitted',
      approvalStage: user.role === 'HR Manager' ? 'HR' : 'Manager'
    });

    // Run Fraud Engine immediately since we have data
    const fraudResult = await detectFraud(expense, null);
    expense.riskScore = fraudResult.riskScore;
    expense.fraudFlags = fraudResult.fraudFlags;

    await expense.save();

    // Create Notification
    await Notification.create({
      userId: req.user.id,
      companyId: req.user.companyId,
      title: 'Expense Claim Submitted',
      message: `Your manual claim of ₹${expense.amount} at ${expense.merchantName} was submitted. Risk Score: ${expense.riskScore}%.`,
      type: expense.riskScore >= 40 ? 'Warning' : 'Info'
    });

    // Notify Department Manager
    if (user.departmentId) {
      const dept = await Department.findById(user.departmentId);
      if (dept && dept.managerId) {
        await Notification.create({
          userId: dept.managerId,
          companyId: req.user.companyId,
          title: 'Pending Department Approval',
          message: `${user.name} submitted a claim of $${expense.amount} at ${expense.merchantName}.`,
          type: expense.riskScore >= 40 ? 'Warning' : 'Info'
        });
      }
    }

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update expense (only drafts can be modified)
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ _id: id, ...req.tenantFilter });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    if (expense.employeeId.toString() !== req.user.id && req.user.role !== 'Company Admin') {
      return res.status(403).json({ error: 'Forbidden: Cannot update this claim' });
    }

    if (expense.status !== 'Draft') {
      return res.status(400).json({ error: 'Only claims in Draft status can be edited' });
    }

    const { category, amount, currency, merchantName, expenseDate, notes } = req.body;
    if (category) expense.category = category;
    if (amount) expense.amount = parseFloat(amount);
    if (currency) expense.currency = currency;
    if (merchantName) expense.merchantName = merchantName;
    if (expenseDate) expense.expenseDate = expenseDate;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit a Draft Expense Claim
const submitExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ _id: id, ...req.tenantFilter });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    if (expense.employeeId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (expense.status !== 'Draft') {
      return res.status(400).json({ error: 'Claim is already submitted' });
    }

    expense.status = 'Submitted';
    expense.approvalStage = 'Manager';

    // Rerun fraud check
    const fraudResult = await detectFraud(expense, null);
    expense.riskScore = fraudResult.riskScore;
    expense.fraudFlags = fraudResult.fraudFlags;

    await expense.save();

    res.json({ message: 'Claim submitted successfully', expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve or Reject Claim (Sequential Approval logic)
const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body; // action: 'Approve' | 'Reject'

    if (!['Approve', 'Reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either Approve or Reject' });
    }

    const expense = await Expense.findOne({ _id: id, ...req.tenantFilter }).populate('employeeId');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    if (expense.status === 'Approved' || expense.status === 'Rejected') {
      return res.status(400).json({ error: 'Expense is already finalized' });
    }

    const currentStage = expense.approvalStage;
    
    // Authorization Check for each workflow stage
    let isAuthorized = false;

    // Company Admin has master permission to approve at any stage
    if (req.user.role === 'Company Admin') {
      isAuthorized = true;
    } else if (currentStage === 'Manager') {
      // Find department manager
      if (expense.departmentId) {
        const dept = await Department.findById(expense.departmentId);
        if (dept && dept.managerId && dept.managerId.toString() === req.user.id) {
          isAuthorized = true;
        }
      }
      if (['Company Admin', 'HR Manager'].includes(req.user.role)) {
        isAuthorized = true;
      }
    } else if (currentStage === 'HR') {
      const isClaimOwner = expense.employeeId?._id?.toString() === req.user.id || expense.employeeId?.toString() === req.user.id;
      if (req.user.role === 'HR Manager' && !isClaimOwner) {
        isAuthorized = true;
      }
    } else if (currentStage === 'Finance') {
      if (req.user.role === 'Auditor') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: `Forbidden: You are not authorized to approve at the ${currentStage} stage` });
    }

    // Process Decisions
    if (action === 'Approve') {
      if (currentStage === 'Manager') {
        expense.approvalStage = 'HR';
        expense.status = 'Under_Review';
      } else if (currentStage === 'HR') {
        expense.approvalStage = 'Finance';
        expense.status = 'Under_Review';
      } else if (currentStage === 'Finance') {
        expense.approvalStage = 'Completed';
        expense.status = 'Approved';
      }
    } else if (action === 'Reject') {
      expense.status = 'Rejected';
    }

    await expense.save();

    // Log in Approval History
    await ApprovalHistory.create({
      expenseId: expense._id,
      approverId: req.user.id,
      roleAtTime: req.user.role,
      action: action === 'Approve' ? 'Approve' : 'Reject',
      comments
    });

    // Notify Employee of state change
    await Notification.create({
      userId: expense.employeeId._id,
      companyId: req.user.companyId,
      title: `Expense Claim ${action}d`,
      message: `Your claim of $${expense.amount} at ${expense.merchantName} was ${action.toLowerCase()}d at the ${currentStage} level. Comments: ${comments || 'None'}`,
      type: action === 'Approve' ? 'Info' : 'Alert'
    });

    // Audit Log
    await AuditLog.create({
      companyId: req.user.companyId,
      userId: req.user.id,
      action: `EXPENSE_${action.toUpperCase()}`,
      details: { expenseId: expense._id, stage: currentStage, comments },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: `Expense claim successfully ${action.toLowerCase()}d`, expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createManualExpense,
  updateExpense,
  submitExpense,
  approveExpense
};
