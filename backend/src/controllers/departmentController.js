const Department = require('../models/Department');
const User = require('../models/User');

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find(req.tenantFilter).populate('managerId', 'name email');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, managerId } = req.body;

    const existing = await Department.findOne({ name, companyId: req.user.companyId });
    if (existing) {
      return res.status(400).json({ error: 'Department name already exists in this company' });
    }

    if (managerId) {
      const manager = await User.findOne({ _id: managerId, companyId: req.user.companyId });
      if (!manager) return res.status(400).json({ error: 'Invalid manager ID' });
    }

    const dept = await Department.create({
      name,
      companyId: req.user.companyId,
      managerId: managerId || undefined
    });

    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, managerId } = req.body;

    const dept = await Department.findOne({ _id: id, companyId: req.user.companyId });
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    if (name) {
      const nameExists = await Department.findOne({
        name,
        companyId: req.user.companyId,
        _id: { $ne: id }
      });
      if (nameExists) return res.status(400).json({ error: 'Department name already in use' });
      dept.name = name;
    }

    if (managerId !== undefined) {
      if (managerId) {
        const manager = await User.findOne({ _id: managerId, companyId: req.user.companyId });
        if (!manager) return res.status(400).json({ error: 'Invalid manager ID' });
        dept.managerId = managerId;
      } else {
        dept.managerId = undefined;
      }
    }

    await dept.save();
    res.json(dept);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findOneAndDelete({ _id: id, companyId: req.user.companyId });
    if (!dept) return res.status(404).json({ error: 'Department not found' });

    // Update users in this department
    await User.updateMany({ departmentId: id }, { $unset: { departmentId: 1 } });

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
