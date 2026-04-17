const AppError = require('../../common/errors/AppError');
const repo = require('./constraint.repository');
const { parseConstraintText } = require('../../integrations/gemini');

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

// LLM: parse raw text → structured constraint JSON, optionally save it
const parse = async ({ raw_text, semester_id, dept_id, auto_save }, userId) => {
  const context = { dept: dept_id, semester: semester_id };
  const parsed_json = await parseConstraintText(raw_text, context);

  if (!auto_save) return { raw_text, parsed_json };

  const saved = await repo.create({
    semester_id,
    dept_id,
    raw_text,
    parsed_json,
    type: parsed_json.type || 'soft',
    weight: parsed_json.weight || 1,
    status: 'pending',
    created_by: userId,
  });

  return { raw_text, parsed_json, saved };
};

module.exports = { getAll, getById, create, update, remove, parse };
