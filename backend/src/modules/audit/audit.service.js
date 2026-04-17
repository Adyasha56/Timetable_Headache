const Audit = require('./audit.model');

const log = (data) => Audit.create(data).catch(() => {}); // non-blocking, never throws

const getAll = async (query = {}) => {
  const { userId, method, page = 1, limit = 20 } = query;
  const filter = {};
  if (userId) filter.user_id = userId;
  if (method) filter.method = method.toUpperCase();
  return Audit.find(filter)
    .sort({ created_at: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .populate('user_id', 'name email');
};

module.exports = { log, getAll };
