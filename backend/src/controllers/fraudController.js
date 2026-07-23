const FraudCase = require('../models/FraudCase');
const AuditLog = require('../models/AuditLog');

const getFraudCases = async (req, res) => {
  try {
    const cases = await FraudCase.find(req.tenantFilter)
      .populate({
        path: 'expenseId',
        populate: { path: 'employeeId', select: 'name email' }
      })
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resolveFraudCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, analystNotes } = req.body; // 'Resolved' or 'Dismissed'

    if (!['Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid resolution status' });
    }

    const fraudCase = await FraudCase.findOne({ _id: id, ...req.tenantFilter });
    if (!fraudCase) return res.status(404).json({ error: 'Fraud case record not found' });

    fraudCase.status = status;
    fraudCase.analystNotes = analystNotes || '';
    fraudCase.resolvedBy = req.user.id;
    await fraudCase.save();

    await AuditLog.create({
      companyId: req.user.companyId,
      userId: req.user.id,
      action: `FRAUD_RESOLVE_${status.toUpperCase()}`,
      details: { caseId: id, status, analystNotes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Fraud case status updated successfully', fraudCase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFraudCases,
  resolveFraudCase
};
