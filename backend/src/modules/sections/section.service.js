const AppError = require('../../common/errors/AppError');
const repo = require('./section.repository');

const getAll = async (query) => {
  const { dept_id, semester, year, page = 1, limit = 20 } = query;
  const filter = {};
  if (dept_id) filter.dept_id = dept_id;
  if (semester) filter.semester = parseInt(semester);
  if (year) filter.year = parseInt(year);
  const [data, total] = await repo.findAll(filter, parseInt(page), parseInt(limit));
  return { data, total, page: parseInt(page), limit: parseInt(limit) };
};

const getById = async (id) => {
  const section = await repo.findById(id);
  if (!section) throw new AppError('Section not found', 404, 'NOT_FOUND');
  return section;
};

const create = (data) => repo.create(data);

const update = async (id, data) => {
  const section = await repo.update(id, data);
  if (!section) throw new AppError('Section not found', 404, 'NOT_FOUND');
  return section;
};

const remove = async (id) => {
  const section = await repo.remove(id);
  if (!section) throw new AppError('Section not found', 404, 'NOT_FOUND');
};

const setSubjects = async (id, subjectIds) => {
  const section = await repo.update(id, { subjects: subjectIds });
  if (!section) throw new AppError('Section not found', 404, 'NOT_FOUND');
  return section;
};

module.exports = { getAll, getById, create, update, remove, setSubjects };
