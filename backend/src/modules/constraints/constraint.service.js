const AppError = require('../../common/errors/AppError');
const repo = require('./constraint.repository');

const getAll = async (query) => {
  const { semesterId, deptId, type, page = 1, limit = 20 } = query;
  const filter = {};
  if (semesterId) filter.semester_id = semesterId;
  if (deptId) filter.dept_id = deptId;
  if (type) filter.type = type;
  const [data, total] = await repo.findAll(filter, parseInt(page), parseInt(limit));
  return { data, total, page: parseInt(page), limit: parseInt(limit) };
};

const getById = async (id) => {
  const constraint = await repo.findById(id);
  if (!constraint) throw new AppError('Constraint not found', 404, 'NOT_FOUND');
  return constraint;
};

const create = (data, userId) => repo.create({ ...data, created_by: userId });

const update = async (id, data) => {
  const constraint = await repo.update(id, data);
  if (!constraint) throw new AppError('Constraint not found', 404, 'NOT_FOUND');
  return constraint;
};

const remove = async (id) => {
  const constraint = await repo.remove(id);
  if (!constraint) throw new AppError('Constraint not found', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, create, update, remove };
