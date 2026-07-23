require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Company = require('../models/Company');
const User = require('../models/User');
const Department = require('../models/Department');
const Policy = require('../models/Policy');
const Expense = require('../models/Expense');
const Receipt = require('../models/Receipt');
const FraudCase = require('../models/FraudCase');
const ApprovalHistory = require('../models/ApprovalHistory');
const { detectFraud } = require('../services/fraudService');
const { parseReceipt } = require('../services/ocrService');

const runValidation = async () => {
  console.log('--- STARTING SYSTEM INTEGRATION VALIDATION ---');
  
  // 1. Database Connection
  await connectDB();

  try {
    // Clean database testing elements if they exist
    console.log('Cleaning test companies and users...');
    const testCompanyName = 'Validation Test Corp';
    await User.deleteMany({ email: 'admin@testcorp.com' });
    await Company.deleteMany({ name: testCompanyName });
    
    // 2. Onboard Tenant Company
    console.log('1. Onboarding new Company...');
    const company = await Company.create({
      name: testCompanyName,
      domain: 'testcorp.com'
    });
    console.log(`   Created Company: ${company.name} [ID: ${company._id}]`);

    // 3. Create Admin User
    console.log('2. Creating Company Admin user...');
    const admin = await User.create({
      name: 'Test Administrator',
      email: 'admin@testcorp.com',
      password: 'testpassword123',
      role: 'Company Admin',
      companyId: company._id,
      isVerified: true,
      status: 'Active'
    });
    console.log(`   Created User: ${admin.name} [Email: ${admin.email}]`);

    // 4. Create Department
    console.log('3. Setting up Sales Department...');
    const department = await Department.create({
      name: 'Sales Dept',
      companyId: company._id,
      managerId: admin._id
    });
    console.log(`   Created Department: ${department.name} [Manager: ${admin.name}]`);

    // Link admin user to department
    admin.departmentId = department._id;
    await admin.save();

    // 5. Create Spending Policy
    console.log('4. Creating Corporate Spending Policy...');
    const policy = await Policy.create({
      companyId: company._id,
      name: 'Standard Travel & Meals Policy',
      rules: {
        maxMealAmount: 50,
        maxTravelAmount: 200,
        allowedVendors: ['Uber', 'Hilton', 'Starbucks', 'Delta'],
        requiresPreApproval: false
      },
      createdBy: admin._id
    });
    console.log(`   Created Policy: ${policy.name} [Meal Limit: $50, Approved Vendors: ${policy.rules.allowedVendors.join(', ')}]`);

    // 6. Test Scenario A: Manual Claim violating policy limits (Meal = $75)
    console.log('5. Simulating Manual Expense exceeding policy limits...');
    const manualExpense = new Expense({
      companyId: company._id,
      employeeId: admin._id,
      departmentId: department._id,
      category: 'Food',
      amount: 75, // exceeds $50 limit
      currency: 'USD',
      merchantName: 'Starbucks Premium',
      notes: 'Team dinner with client',
      status: 'Submitted',
      approvalStage: 'Manager'
    });

    const fraudResultA = await detectFraud(manualExpense, null);
    manualExpense.riskScore = fraudResultA.riskScore;
    manualExpense.fraudFlags = fraudResultA.fraudFlags;
    await manualExpense.save();

    console.log(`   Expense Saved. [Amount: $${manualExpense.amount}] [Risk Score: ${manualExpense.riskScore}%]`);
    console.log('   Fraud Flags raised:');
    manualExpense.fraudFlags.forEach(flag => console.log(`   - ${flag}`));

    // Assert that a Fraud Case was registered
    const fraudCase = await FraudCase.findOne({ expenseId: manualExpense._id });
    if (fraudCase) {
      console.log(`   [ASSERTION PASSED] Fraud Case successfully raised. [Level: ${fraudCase.riskLevel}]`);
    } else {
      console.error('   [ASSERTION FAILED] No Fraud Case registered for policy violation!');
    }

    // 7. Test Scenario B: Simulating Receipt File Upload and Worker Processing
    console.log('6. Simulating Async Receipt File Processing...');
    // Create Mock Receipt
    const receipt = await Receipt.create({
      companyId: company._id,
      uploadedBy: admin._id,
      fileUrl: 'http://localhost:5000/uploads/receipt-mock.png',
      fileType: 'image/png',
      ocrStatus: 'Pending'
    });

    const draftExpense = await Expense.create({
      companyId: company._id,
      employeeId: admin._id,
      departmentId: department._id,
      category: 'Travel',
      amount: 0,
      merchantName: 'Pending OCR Processing',
      receiptId: receipt._id,
      status: 'Draft',
      approvalStage: 'Employee'
    });

    console.log(`   Simulating OCR Scan on receipt file...`);
    const ocrData = await parseReceipt(receipt.fileUrl);
    
    // Update Receipt status
    receipt.ocrStatus = 'Completed';
    receipt.extractedData = ocrData;
    await receipt.save();

    // Populate and update draft expense
    draftExpense.amount = ocrData.amount;
    draftExpense.merchantName = ocrData.merchantName;
    draftExpense.category = ocrData.category;
    draftExpense.status = 'Submitted';
    draftExpense.approvalStage = 'Manager';

    const fraudResultB = await detectFraud(draftExpense, ocrData);
    draftExpense.riskScore = fraudResultB.riskScore;
    draftExpense.fraudFlags = fraudResultB.fraudFlags;
    await draftExpense.save();

    console.log(`   Simulated OCR Completed.`);
    console.log(`   Parsed Data -> Merchant: ${ocrData.merchantName} | Amount: $${ocrData.amount} | Category: ${ocrData.category}`);
    console.log(`   Expense Updated. [ID: ${draftExpense._id}] [Risk Score: ${draftExpense.riskScore}%]`);

    // 8. Test Scenario C: Sequenced Approvals
    console.log('7. Simulating Sequential Approvals...');
    console.log(`   Current Approval Stage: ${draftExpense.approvalStage} | Status: ${draftExpense.status}`);
    
    // Stage 1: Manager Approve
    draftExpense.approvalStage = 'HR';
    draftExpense.status = 'Under_Review';
    await draftExpense.save();
    await ApprovalHistory.create({
      expenseId: draftExpense._id,
      approverId: admin._id,
      roleAtTime: 'Company Admin',
      action: 'Approve',
      comments: 'Receipt scan aligns. Forwarded to HR.'
    });
    console.log(`   Manager Approved -> Stage is now: ${draftExpense.approvalStage}`);

    // Stage 2: HR Approve
    draftExpense.approvalStage = 'Finance';
    await draftExpense.save();
    await ApprovalHistory.create({
      expenseId: draftExpense._id,
      approverId: admin._id,
      roleAtTime: 'Company Admin',
      action: 'Approve',
      comments: 'Travel matches sales schedule.'
    });
    console.log(`   HR Approved -> Stage is now: ${draftExpense.approvalStage}`);

    // Stage 3: Finance Approve (Finalize)
    draftExpense.approvalStage = 'Completed';
    draftExpense.status = 'Approved';
    await draftExpense.save();
    await ApprovalHistory.create({
      expenseId: draftExpense._id,
      approverId: admin._id,
      roleAtTime: 'Company Admin',
      action: 'Approve',
      comments: 'Payment authorized.'
    });
    console.log(`   Finance Approved -> Final status: ${draftExpense.status} | Stage: ${draftExpense.approvalStage}`);

    console.log('\n--- ALL INTEGRATION SCENARIOS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error(`Validation Scenario Failed: ${error.message}`);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runValidation();
