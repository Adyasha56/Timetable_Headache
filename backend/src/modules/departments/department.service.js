const AppError = require('../../common/errors/AppError');
const repo = require('./department.repository');

const getAll = (query) => {
  const filter = {};
  if (query.active !== undefined) filter.active = query.active === 'true';
  return repo.findAll(filter);
};

const getById = async (id) => {
  const dept = await repo.findById(id);
  if (!dept) throw new AppError('Department not found', 404, 'NOT_FOUND');
  return dept;
};

const create = (data) => repo.create(data);

const update = async (id, data) => {
  const dept = await repo.update(id, data);
  if (!dept) throw new AppError('Department not found', 404, 'NOT_FOUND');
  return dept;
};

const remove = async (id) => {
  const dept = await repo.remove(id);
  if (!dept) throw new AppError('Department not found', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, create, update, remove };
