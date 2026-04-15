const AppError = require('../../common/errors/AppError');
const repo = require('./room.repository');

const getAll = async (query) => {
  const { dept_id, type, page = 1, limit = 20 } = query;
  const filter = {};
  if (dept_id) filter.dept_id = dept_id;
  if (type) filter.type = type;
  const [data, total] = await repo.findAll(filter, parseInt(page), parseInt(limit));
  return { data, total, page: parseInt(page), limit: parseInt(limit) };
};

const getById = async (id) => {
  const room = await repo.findById(id);
  if (!room) throw new AppError('Room not found', 404, 'NOT_FOUND');
  return room;
};

const create = (data) => repo.create(data);

const update = async (id, data) => {
  const room = await repo.update(id, data);
  if (!room) throw new AppError('Room not found', 404, 'NOT_FOUND');
  return room;
};

const remove = async (id) => {
  const room = await repo.remove(id);
  if (!room) throw new AppError('Room not found', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, create, update, remove };
