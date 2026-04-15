const AppError = require('../../common/errors/AppError');
const repo = require('./faculty.repository');

const getAll = async (query) => {
  const { dept_id, page = 1, limit = 20 } = query;
  const filter = {};
  if (dept_id) filter.dept_id = dept_id;
  const [data, total] = await repo.findAll(filter, parseInt(page), parseInt(limit));
  return { data, total, page: parseInt(page), limit: parseInt(limit) };
};

const getById = async (id) => {
  const faculty = await repo.findById(id);
  if (!faculty) throw new AppError('Faculty not found', 404, 'NOT_FOUND');
  return faculty;
};

const create = (data) => repo.create(data);

const update = async (id, data) => {
  const faculty = await repo.update(id, data);
  if (!faculty) throw new AppError('Faculty not found', 404, 'NOT_FOUND');
  return faculty;
};

const remove = async (id) => {
  const faculty = await repo.remove(id);
  if (!faculty) throw new AppError('Faculty not found', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, create, update, remove };
