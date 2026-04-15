const service = require('./department.service');
const { success } = require('../../common/utils/response');

const getAll = async (req, res, next) => {
  try { success(res, await service.getAll(req.query)); } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try { success(res, await service.getById(req.params.id)); } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try { success(res, await service.create(req.body), 201); } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try { success(res, await service.update(req.params.id, req.body)); } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try { await service.remove(req.params.id); success(res, null, 204); } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
