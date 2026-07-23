const Policy = require('../models/Policy');
const AuditLog = require('../models/AuditLog');

const getPolicies = async (req, res) => {
  try {
    const policies = await Policy.find(req.tenantFilter).populate('createdBy', 'name email');
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPolicy = async (req, res) => {
  try {
    const { name, description, rules, isActive } = req.body;

    const policy = await Policy.create({
      companyId: req.user.companyId,
      name,
      description,
      rules: {
        maxMealAmount: rules?.maxMealAmount || 0,
        maxTravelAmount: rules?.maxTravelAmount || 0,
        dailyLimit: rules?.dailyLimit || 0,
        monthlyLimit: rules?.monthlyLimit || 0,
        allowedVendors: rules?.allowedVendors || [],
        requiresPreApproval: rules?.requiresPreApproval || false
      },
      createdBy: req.user.id,
      isActive: isActive !== undefined ? isActive : true
    });

    await AuditLog.create({
      companyId: req.user.companyId,
      userId: req.user.id,
      action: 'POLICY_CREATE',
      details: { policyId: policy._id, name: policy.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, rules, isActive } = req.body;

    const policy = await Policy.findOne({ _id: id, companyId: req.user.companyId });
    if (!policy) return res.status(404).json({ error: 'Policy not found' });

    if (name) policy.name = name;
    if (description !== undefined) policy.description = description;
    if (isActive !== undefined) policy.isActive = isActive;
    
    if (rules) {
      if (rules.maxMealAmount !== undefined) policy.rules.maxMealAmount = rules.maxMealAmount;
      if (rules.maxTravelAmount !== undefined) policy.rules.maxTravelAmount = rules.maxTravelAmount;
      if (rules.dailyLimit !== undefined) policy.rules.dailyLimit = rules.dailyLimit;
      if (rules.monthlyLimit !== undefined) policy.rules.monthlyLimit = rules.monthlyLimit;
      if (rules.allowedVendors !== undefined) policy.rules.allowedVendors = rules.allowedVendors;
      if (rules.requiresPreApproval !== undefined) policy.rules.requiresPreApproval = rules.requiresPreApproval;
    }

    await policy.save();

    await AuditLog.create({
      companyId: req.user.companyId,
      userId: req.user.id,
      action: 'POLICY_UPDATE',
      details: { policyId: policy._id, name: policy.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await Policy.findOneAndDelete({ _id: id, companyId: req.user.companyId });
    if (!policy) return res.status(404).json({ error: 'Policy not found' });

    await AuditLog.create({
      companyId: req.user.companyId,
      userId: req.user.id,
      action: 'POLICY_DELETE',
      details: { policyId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy
};
