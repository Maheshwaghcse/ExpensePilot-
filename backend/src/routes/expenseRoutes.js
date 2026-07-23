const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyToken } = require('../middleware/auth');
const enforceTenant = require('../middleware/tenant');
const authorizeRoles = require('../middleware/role');
const { validateFields } = require('../middleware/validator');

router.use(verifyToken);
router.use(enforceTenant);

router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpenseById);

router.post(
  '/manual',
  validateFields(['category', 'amount', 'merchantName']),
  expenseController.createManualExpense
);

router.put('/:id', expenseController.updateExpense);
router.post('/:id/submit', expenseController.submitExpense);

// Multi-stage approval endpoint
router.post(
  '/:id/approve',
  authorizeRoles('Company Admin', 'HR Manager', 'Auditor', 'Employee'), // checked in controller for dynamic manager links
  validateFields(['action']),
  expenseController.approveExpense
);

module.exports = router;
