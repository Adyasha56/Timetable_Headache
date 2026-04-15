const AppError = require('../../common/errors/AppError');
const repo = require('./subject.repository');

const getAll = async (query) => {
  const { dept_id, type, page = 1, limit = 20 } = query;
  const filter = {};
  if (dept_id) filter.dept_id = dept_id;
  if (type) filter.type = type;
  const [data, total] = await repo.findAll(filter, parseInt(page), parseInt(limit));
  return { data, total, page: parseInt(page), limit: parseInt(limit) };
};

const getById = async (id) => {
  const subject = await repo.findById(id);
  if (!subject) throw new AppError('Subject not found', 404, 'NOT_FOUND');
  return subject;
};

const create = (data) => repo.create(data);

const update = async (id, data) => {
  const subject = await repo.update(id, data);
  if (!subject) throw new AppError('Subject not found', 404, 'NOT_FOUND');
  return subject;
};

const remove = async (id) => {
  const subject = await repo.remove(id);
  if (!subject) throw new AppError('Subject not found', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, create, update, remove };
