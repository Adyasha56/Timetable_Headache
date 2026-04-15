const AppError = require('../../common/errors/AppError');
const repo = require('./override.repository');

const getAll = async (query) => {
  const { date, type, page = 1, limit = 20 } = query;
  const filter = {};
  if (date) filter.date = new Date(date);
  if (type) filter.type = type;
  const [data, total] = await repo.findAll(filter, parseInt(page), parseInt(limit));
  return { data, total, page: parseInt(page), limit: parseInt(limit) };
};

const getById = async (id) => {
  const override = await repo.findById(id);
  if (!override) throw new AppError('Override not found', 404, 'NOT_FOUND');
  return override;
};

const createAbsence = (body, userId) =>
  repo.create({ ...body, type: 'teacher_absent', created_by: userId });

const createRoomBlock = (body, userId) =>
  repo.create({ ...body, type: 'room_blocked', created_by: userId });

const createExtraClass = (body, userId) =>
  repo.create({ ...body, type: 'extra_class', created_by: userId });

const remove = async (id) => {
  const override = await repo.remove(id);
  if (!override) throw new AppError('Override not found', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, createAbsence, createRoomBlock, createExtraClass, remove };
