const service = require('./timetable.service');
const { success } = require('../../common/utils/response');

const getAll = async (req, res, next) => {
  try {
    const result = await service.getAll(req.query);
    success(res, result.data, 200, { total: result.total, page: result.page, limit: result.limit });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try { success(res, await service.getById(req.params.scheduleId)); } catch (err) { next(err); }
};

const generate = async (req, res, next) => {
  try { success(res, await service.generate(req.body), 202); } catch (err) { next(err); }
};

const getStatus = async (req, res, next) => {
  try { success(res, await service.getStatus(req.params.scheduleId)); } catch (err) { next(err); }
};

const lock = async (req, res, next) => {
  try { success(res, await service.lock(req.params.scheduleId)); } catch (err) { next(err); }
};

const publish = async (req, res, next) => {
  try { success(res, await service.publish(req.params.scheduleId)); } catch (err) { next(err); }
};

module.exports = { getAll, getById, generate, getStatus, lock, publish };
