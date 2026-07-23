const Expense = require('../models/Expense');
const FraudCase = require('../models/FraudCase');
const Department = require('../models/Department');
const User = require('../models/User');
const mongoose = require('mongoose');

const getDashboardAnalytics = async (req, res) => {
  try {
    const companyId = new mongoose.Types.ObjectId(req.user.companyId);

    // 1. Core Metrics Summary
    const approvedStats = await Expense.aggregate([
      { $match: { companyId, status: 'Approved' } },
      { $group: { _id: null, totalSpent: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const totalSpent = approvedStats[0]?.totalSpent || 0;
    const pendingCount = await Expense.countDocuments({ companyId, status: { $in: ['Submitted', 'Under_Review'] } });
    const fraudCount = await FraudCase.countDocuments({ companyId, status: 'Open' });
    const totalClaims = await Expense.countDocuments({ companyId });

    // 2. Spending Grouped by Expense Category
    const categoryStats = await Expense.aggregate([
      { $match: { companyId, status: 'Approved' } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
      { $project: { name: '$_id', value: { $round: ['$value', 2] }, _id: 0 } }
    ]);

    // 3. Spending Grouped by Department
    const departmentStats = await Expense.aggregate([
      { $match: { companyId, status: 'Approved' } },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$dept.name', value: { $sum: '$amount' } } },
      { $project: { name: { $ifNull: ['$_id', 'Unassigned'] }, value: { $round: ['$value', 2] }, _id: 0 } }
    ]);

    // 4. Monthly Trend Data (Past 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyStats = await Expense.aggregate([
      { $match: { companyId, status: 'Approved', expenseDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' }
          },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendData = monthlyStats.map(item => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      amount: parseFloat(item.amount.toFixed(2))
    }));

    // 5. Top Employees by Spending
    const topEmployees = await Expense.aggregate([
      { $match: { companyId, status: 'Approved' } },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'emp'
        }
      },
      { $unwind: '$emp' },
      { $group: { _id: '$emp.name', amount: { $sum: '$amount' } } },
      { $sort: { amount: -1 } },
      { $limit: 5 },
      { $project: { name: '$_id', amount: { $round: ['$amount', 2] }, _id: 0 } }
    ]);

    // 6. Risk Level Breakdown
    const riskStats = await Expense.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: null,
          avgRisk: { $avg: '$riskScore' },
          highRiskCount: { $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] } },
          mediumRiskCount: { $sum: { $cond: [{ $and: [{ $gte: ['$riskScore', 40] }, { $lt: ['$riskScore', 70] }] }, 1, 0] } },
          lowRiskCount: { $sum: { $cond: [{ $lt: ['$riskScore', 40] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      metrics: {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        pendingCount,
        fraudCount,
        totalClaims
      },
      categoryStats,
      departmentStats,
      trendData,
      topEmployees,
      riskStats: riskStats[0] || { avgRisk: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardAnalytics
};
