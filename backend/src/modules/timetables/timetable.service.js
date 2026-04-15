const AppError = require('../../common/errors/AppError');
const repo = require('./timetable.repository');

const getAll = async (query) => {
  const { semesterId, deptId, status, page = 1, limit = 20 } = query;
  const filter = {};
  if (semesterId) filter.semester_id = semesterId;
  if (deptId) filter.dept_id = deptId;
  if (status) filter.status = status;
  const [data, total] = await repo.findSchedules(filter, parseInt(page), parseInt(limit));
  return { data, total, page: parseInt(page), limit: parseInt(limit) };
};

const getById = async (id) => {
  const schedule = await repo.findScheduleById(id);
  if (!schedule) throw new AppError('Schedule not found', 404, 'NOT_FOUND');
  return schedule;
};

const generate = async ({ semester_id, dept_id }) => {
  // Create a draft schedule shell
  const schedule = await repo.createSchedule({ semester_id, dept_id, status: 'draft' });

  // Create a solver job (Python worker will pick this up via Redis in Phase 2)
  const job = await repo.createSolverJob({
    schedule_id: schedule._id,
    dept_id,
    status: 'pending',
    queue_name: `solver:${dept_id}`,
  });

  return { scheduleId: schedule._id, jobId: job._id, status: 'pending' };
};

const getStatus = async (scheduleId) => {
  const jobs = await repo.findJobsBySchedule(scheduleId);
  if (!jobs.length) throw new AppError('No jobs found for this schedule', 404, 'NOT_FOUND');
  return jobs;
};

const lock = async (scheduleId) => {
  const schedule = await repo.findScheduleById(scheduleId);
  if (!schedule) throw new AppError('Schedule not found', 404, 'NOT_FOUND');
  if (schedule.status !== 'draft') {
    throw new AppError('Only draft schedules can be locked', 400, 'INVALID_STATE');
  }
  return repo.updateSchedule(scheduleId, { 'sessions.$[].is_locked': true });
};

const publish = async (scheduleId) => {
  const schedule = await repo.findScheduleById(scheduleId);
  if (!schedule) throw new AppError('Schedule not found', 404, 'NOT_FOUND');
  if (schedule.status === 'published') {
    throw new AppError('Schedule is already published', 400, 'INVALID_STATE');
  }
  return repo.updateSchedule(scheduleId, {
    status: 'published',
    published_at: new Date(),
    version: schedule.version + 1,
  });
};

module.exports = { getAll, getById, generate, getStatus, lock, publish };
