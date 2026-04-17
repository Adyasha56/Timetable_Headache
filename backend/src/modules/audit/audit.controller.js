const service = require('./audit.service');
const { success } = require('../../common/utils/response');

const getAll = async (req, res, next) => {
  try { success(res, await service.getAll(req.query)); } catch (err) { next(err); }
};

module.exports = { getAll };
