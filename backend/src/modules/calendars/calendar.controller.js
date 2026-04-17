const service = require('./calendar.service');
const { rollover } = require('./rollover.service');
const { success } = require('../../common/utils/response');

const getAll = async (req, res, next) => {
  try { success(res, await service.getAll()); } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try { success(res, await service.getById(req.params.semesterId)); } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try { success(res, await service.create(req.body), 201); } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { success(res, await service.update(req.params.semesterId, req.body)); } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try { await service.remove(req.params.semesterId); success(res, null, 204); } catch (err) { next(err); }
};

const rolloverCalendar = async (req, res, next) => {
  try { success(res, await rollover(req.body), 201); } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, rolloverCalendar };
