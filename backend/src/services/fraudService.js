const Expense = require('../models/Expense');
const Policy = require('../models/Policy');
const FraudCase = require('../models/FraudCase');

const detectFraud = async (expense, receiptData = null) => {
  let riskScore = 0;
  const fraudFlags = [];
  const companyId = expense.companyId;

  // 1. Check for Duplicate Receipts in the database
  if (expense.amount && expense.merchantName) {
    const oneDay = 24 * 60 * 60 * 1000;
    const start = new Date(expense.expenseDate.getTime() - oneDay);
    const end = new Date(expense.expenseDate.getTime() + oneDay);

    const duplicate = await Expense.findOne({
      companyId,
      _id: { $ne: expense._id },
      employeeId: expense.employeeId,
      amount: expense.amount,
      merchantName: { $regex: new RegExp(`^${expense.merchantName}$`, 'i') },
      expenseDate: { $gte: start, $lte: end },
      status: { $ne: 'Rejected' }
    });

    if (duplicate) {
      riskScore += 45;
      fraudFlags.push(`Duplicate claim: matches another expense ID (${duplicate._id}) by amount, merchant, and date.`);
    }
  }

  // 2. Cross check user inputs with OCR extracted values
  if (receiptData) {
    const amountDiff = Math.abs(expense.amount - receiptData.amount);
    if (amountDiff > 1.0) { // Difference larger than 1 dollar/currency unit
      riskScore += 30;
      fraudFlags.push(`Amount mismatch: manually input amount ($${expense.amount}) differs from OCR extracted amount ($${receiptData.amount}).`);
    }

    if (receiptData.merchantName && expense.merchantName) {
      const manualMerchant = expense.merchantName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const ocrMerchant = receiptData.merchantName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!manualMerchant.includes(ocrMerchant) && !ocrMerchant.includes(manualMerchant)) {
        riskScore += 20;
        fraudFlags.push(`Merchant mismatch: manual merchant name '${expense.merchantName}' doesn't match OCR parsed name '${receiptData.merchantName}'.`);
      }
    }
  }

  // 3. Match against Policy limits
  const activePolicies = await Policy.find({ companyId, isActive: true });
  for (const policy of activePolicies) {
    // Check Category Limit (Food/Meal limit)
    if (expense.category === 'Food' && policy.rules?.maxMealAmount > 0) {
      if (expense.amount > policy.rules.maxMealAmount) {
        riskScore += 25;
        fraudFlags.push(`Policy violation: Meal expense exceeds the maximum Meal limit of $${policy.rules.maxMealAmount}.`);
      }
    }

    // Check Travel Limit
    if (expense.category === 'Travel' && policy.rules?.maxTravelAmount > 0) {
      if (expense.amount > policy.rules.maxTravelAmount) {
        riskScore += 25;
        fraudFlags.push(`Policy violation: Travel expense exceeds the maximum Travel limit of $${policy.rules.maxTravelAmount}.`);
      }
    }

    // Check allowed vendors
    if (policy.rules?.allowedVendors && policy.rules.allowedVendors.length > 0) {
      const isAllowed = policy.rules.allowedVendors.some(vendor => 
        expense.merchantName.toLowerCase().includes(vendor.toLowerCase())
      );
      if (!isAllowed) {
        riskScore += 15;
        fraudFlags.push(`Policy alert: Merchant '${expense.merchantName}' is not in the approved vendors list.`);
      }
    }
  }

  // 4. Repeated submission patterns under limits (e.g. thresholds of $50)
  // Let's count expenses submitted by the same user with amounts between 48.00 and 49.99
  const thresholdMin = 48.00;
  const thresholdMax = 49.99;
  if (expense.amount >= thresholdMin && expense.amount <= thresholdMax) {
    const recentNearThreshold = await Expense.countDocuments({
      employeeId: expense.employeeId,
      amount: { $gte: thresholdMin, $lte: thresholdMax },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // past 30 days
    });

    if (recentNearThreshold >= 3) {
      riskScore += 20;
      fraudFlags.push(`Suspicious submission cluster: submitted ${recentNearThreshold} claims in the past 30 days between $${thresholdMin} and $${thresholdMax} (potential threshold avoidance).`);
    }
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  // Create a FraudCase entry if there are any flagged anomalies (riskScore > 0 or flags present)
  if (fraudFlags.length > 0) {
    await FraudCase.create({
      companyId,
      expenseId: expense._id,
      detectedRules: fraudFlags,
      riskLevel: riskScore >= 70 ? 'High' : (riskScore >= 40 ? 'Medium' : 'Low'),
      status: 'Open'
    });
  }

  return {
    riskScore,
    fraudFlags
  };
};

module.exports = {
  detectFraud
};
