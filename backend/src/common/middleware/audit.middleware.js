const auditService = require('../../modules/audit/audit.service');

const MUTATING = ['POST', 'PATCH', 'PUT', 'DELETE'];

const auditLog = (req, res, next) => {
  if (!MUTATING.includes(req.method)) return next();

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (req.user) {
      auditService.log({
        user_id: req.user.id,
        user_email: req.user.email,
        method: req.method,
        path: req.originalUrl,
        body: req.body,
        status_code: res.statusCode,
        ip: req.ip,
      });
    }
    return originalJson(body);
  };

  next();
};

module.exports = { auditLog };
