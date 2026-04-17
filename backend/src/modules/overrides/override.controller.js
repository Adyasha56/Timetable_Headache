const service = require('./override.service');
const { success } = require('../../common/utils/response');

const getAll = async (req, res, next) => {
  try {
    const result = await service.getAll(req.query);
    success(res, result.data, 200, { total: result.total, page: result.page, limit: result.limit });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try { success(res, await service.getById(req.params.id)); } catch (err) { next(err); }
};

const createAbsence = async (req, res, next) => {
  try { success(res, await service.createAbsence(req.body, req.user.id), 201); } catch (err) { next(err); }
};

const createRoomBlock = async (req, res, next) => {
  try { success(res, await service.createRoomBlock(req.body, req.user.id), 201); } catch (err) { next(err); }
};

const createExtraClass = async (req, res, next) => {
  try { success(res, await service.createExtraClass(req.body, req.user.id), 201); } catch (err) { next(err); }
};

const getSuggestions = async (req, res, next) => {
  try { success(res, await service.getSuggestions(req.query)); } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try { await service.remove(req.params.id); success(res, null, 204); } catch (err) { next(err); }
};

module.exports = { getAll, getById, createAbsence, createRoomBlock, createExtraClass, getSuggestions, remove };
