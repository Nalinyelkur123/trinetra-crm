const { db } = require('../config/db');

const auditLogger = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    res.json = originalJson;
    
    // Log after the response is sent
    const method = req.method;
    const path = req.path;
    const user = req.user; // Set by authenticateToken
    
    if (user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        const action = `${method} ${path}`;
        let targetType = 'Unknown';
        let targetId = null;
        
        // Infer target type from path
        const parts = path.split('/');
        if (parts.length > 1) {
          targetType = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
          // If it's a specific ID
          if (parts[2] && !isNaN(parts[2])) {
            targetId = parts[2];
          }
        }

        db.prepare(`
          INSERT INTO audit_logs (user_id, action, target_type, target_id, timestamp)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(user.id, action, targetType, targetId);
      } catch (err) {
        console.error('Audit Logging Failed:', err);
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = auditLogger;
