const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('Auth Failure: Missing Token');
    return res.status(401).json({ error: 'Access denied: No token provided' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'trinetra_production_jwt_secure_secret_key_2026_x89a';
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.status(403).json({ error: 'Invalid or Expired Token' });
    }
    req.user = user;
    next();
  });
};

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User context missing' });
    }
    
    // Normalize roles for comparison
    const userRole = req.user.role?.toLowerCase();
    const requiredRole = role?.toLowerCase();

    if (userRole !== requiredRole) {
      console.warn(`Permission Denied: User role '${userRole}' does not match required '${requiredRole}'`);
      return res.status(403).json({ error: `Access forbidden: Required role is ${role}` });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
