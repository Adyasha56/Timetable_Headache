const AppError = require('../../common/errors/AppError');
const repo = require('./user.repository');

const getAll = async (query) => {
  const { role, dept_id, status, page = 1, limit = 20 } = query;
  const filter = {};
  if (role)    filter.role    = role;
  if (dept_id) filter.dept_id = dept_id;
  if (status)  filter.status  = status;
  const [data, total] = await repo.findAll(filter, parseInt(page), parseInt(limit));
  return { data, total, page: parseInt(page), limit: parseInt(limit) };
};

const getById = async (id) => {
  const user = await repo.findById(id);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
};

const create = async (data) => {
  const existing = await repo.findByEmail(data.email);
  if (existing) throw new AppError(`Email '${data.email}' already exists`, 409, 'DUPLICATE');
  // password_hash field is hashed by pre('save') hook in user.model.js
  return repo.create({ ...data, password_hash: data.password });
};

const update = async (id, data) => {
  // Prevent password update through this endpoint — use a dedicated change-password route
  delete data.password;
  delete data.password_hash;
  const user = await repo.update(id, data);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
};

const remove = async (id) => {
  const user = await repo.remove(id);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, create, update, remove };
