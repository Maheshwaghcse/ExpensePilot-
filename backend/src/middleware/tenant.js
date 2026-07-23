const enforceTenant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  // Super Admin can bypass tenant isolation filter
  if (req.user.role === 'Super Admin') {
    req.tenantFilter = {};
  } else {
    if (!req.user.companyId) {
      return res.status(403).json({ error: 'Forbidden: Tenant isolation context missing' });
    }
    req.tenantFilter = { companyId: req.user.companyId };
  }
  next();
};

module.exports = enforceTenant;
