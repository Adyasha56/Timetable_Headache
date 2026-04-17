const AppError = require('../../common/errors/AppError');
const repo = require('./override.repository');
const { findSubstitutes } = require('./greedy.service');

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

const createAbsence = async (body, userId) => {
  // If no substitute given, auto-suggest one via greedy
  let suggestions = [];
  if (!body.substitute_teacher_id) {
    suggestions = await findSubstitutes({
      dept_id: body.dept_id,
      date: body.date,
      slot: body.slot,
      subject_id: body.subject_id,
    });
  }
  const override = await repo.create({ ...body, type: 'teacher_absent', created_by: userId });
  return { override, suggestions };
};

const createRoomBlock = (body, userId) =>
  repo.create({ ...body, type: 'room_blocked', created_by: userId });

const createExtraClass = (body, userId) =>
  repo.create({ ...body, type: 'extra_class', created_by: userId });

const getSuggestions = async (query) => {
  const { dept_id, date, period, subject_id } = query;
  if (!dept_id || !date || !period) {
    throw new AppError('dept_id, date, and period are required', 400, 'VALIDATION_ERROR');
  }
  return findSubstitutes({ dept_id, date, slot: { period: parseInt(period) }, subject_id });
};

const remove = async (id) => {
  const override = await repo.remove(id);
  if (!override) throw new AppError('Override not found', 404, 'NOT_FOUND');
};

module.exports = { getAll, getById, createAbsence, createRoomBlock, createExtraClass, getSuggestions, remove };
