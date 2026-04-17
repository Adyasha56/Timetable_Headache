const AppError = require('../../common/errors/AppError');
const repo = require('./faculty.repository');
const Subject = require('../subjects/subject.model');
const Department = require('../departments/department.model');
const { suggestAllocation } = require('../../integrations/gemini');

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

// AI Touchpoint 1: Gemini suggests faculty-subject allocation before solver runs
const getSuggestedAllocation = async ({ dept_id, semester_id }) => {
  const [facultyArr, subjects, dept] = await Promise.all([
    repo.findAll({ dept_id, status: 'active' }, 1, 100).then(([data]) => data),
    Subject.find({ dept_id, active: true }).lean(),
    Department.findById(dept_id).lean(),
  ]);

  if (!facultyArr.length) throw new AppError('No active faculty found for this department', 400, 'NO_DATA');
  if (!subjects.length) throw new AppError('No subjects found for this department', 400, 'NO_DATA');

  const suggestions = await suggestAllocation({
    faculty_list: facultyArr,
    subject_list: subjects,
    dept_name: dept ? dept.name : dept_id,
    semester_name: semester_id,
  });

  return {
    dept_id,
    semester_id,
    suggestions,
    note: 'Review and adjust before running the solver. These are AI proposals only.',
  };
};

module.exports = { getAll, getById, create, update, remove, getSuggestedAllocation };
