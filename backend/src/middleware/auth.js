const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role, 
      companyId: user.companyId 
    },
    process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_987654321_abc',
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_123456789_xyz',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_987654321_abc');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Access token expired or invalid' });
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};
