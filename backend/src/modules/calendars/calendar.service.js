const AppError = require('../../common/errors/AppError');
const repo = require('./calendar.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const cal = await repo.findById(id);
  if (!cal) throw new AppError('Calendar not found', 404, 'NOT_FOUND');
  return cal;
};

const create = async (data) => {
  const existing = await repo.findBySemester(data.year, data.semester);
  if (existing) {
    throw new AppError(
      `Calendar for ${data.year} semester ${data.semester} already exists`,
      409,
      'DUPLICATE'
    );
  }
  return repo.create(data);
};

const update = async (id, data) => {
  const cal = await repo.update(id, data);
  if (!cal) throw new AppError('Calendar not found', 404, 'NOT_FOUND');
  return cal;
};

const remove = async (id) => {
  const cal = await repo.remove(id);
  if (!cal) throw new AppError('Calendar not found', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, create, update, remove };
