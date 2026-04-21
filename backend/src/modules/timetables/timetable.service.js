const AppError = require('../../common/errors/AppError');
const repo = require('./timetable.repository');
const { dispatchSolverJob } = require('./queue.service');
const { explainConflict } = require('../../integrations/gemini');

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

const generate = async ({ semester_id, dept_id, section_id, faculty_allocation }) => {
  const scheduleData = { semester_id, dept_id, status: 'draft' };
  if (section_id) scheduleData.section_id = section_id;

  const schedule = await repo.createSchedule(scheduleData);

  const job = await repo.createSolverJob({
    schedule_id: schedule._id,
    dept_id,
    status: 'pending',
    queue_name: 'solver:jobs',
  });

  // Dispatch to Redis — Python worker picks this up
  const payload = {
    schedule_id: schedule._id.toString(),
    job_id: job._id.toString(),
    dept_id: dept_id.toString(),
    semester_id: semester_id.toString(),
  };
  if (section_id) payload.section_id = section_id.toString();
  // Optional: pass AI-suggested allocation so worker can pre-bind faculty to subjects
  if (faculty_allocation && Array.isArray(faculty_allocation)) {
    payload.faculty_allocation = faculty_allocation;
  }

  await dispatchSolverJob(payload);

  return { scheduleId: schedule._id, jobId: job._id, status: 'pending', section_id: section_id || null };
};

const getStatus = async (scheduleId) => {
  const jobs = await repo.findJobsBySchedule(scheduleId);
  if (!jobs.length) throw new AppError('No jobs found for this schedule', 404, 'NOT_FOUND');
  return jobs;
};

// SSE: polls job status from DB every 2s and streams updates to client
const streamStatus = async (scheduleId, send, onClose) => {
  const interval = setInterval(async () => {
    try {
      const jobs = await repo.findJobsBySchedule(scheduleId);
      if (!jobs.length) {
        send('error', { message: 'No jobs found' });
        clearInterval(interval);
        onClose();
        return;
      }

      const statuses = jobs.map((j) => ({
        jobId: j._id,
        dept_id: j.dept_id,
        status: j.status,
        error: j.error || null,
      }));

      const allSettled = jobs.every((j) => j.status === 'done' || j.status === 'failed');
      const anyRunning = jobs.some((j) => j.status === 'running');
      const anyFailed  = jobs.some((j) => j.status === 'failed');

      if (anyRunning) send('running', { jobs: statuses });

      if (allSettled) {
        clearInterval(interval);
        send(anyFailed ? 'failed' : 'completed', { jobs: statuses });
        onClose();
      }
    } catch {
      clearInterval(interval);
      onClose();
    }
  }, 2000);

  return () => clearInterval(interval);
};

const remove = async (scheduleId) => {
  const schedule = await repo.findScheduleById(scheduleId);
  if (!schedule) throw new AppError('Schedule not found', 404, 'NOT_FOUND');
  if (schedule.status === 'published') {
    throw new AppError('Published schedules cannot be deleted', 400, 'INVALID_STATE');
  }
  await repo.deleteSchedule(scheduleId);
  return { deleted: true };
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

const explainScheduleConflict = async (scheduleId) => {
  const jobs = await repo.findJobsBySchedule(scheduleId);
  const failedJobs = jobs.filter((j) => j.status === 'failed');
  if (!failedJobs.length) throw new AppError('No failed jobs to explain', 400, 'NO_CONFLICT');

  const explanation = await explainConflict({
    schedule_id: scheduleId,
    failed_jobs: failedJobs.map((j) => ({ dept_id: j.dept_id, error: j.error })),
  });

  return { explanation };
};

module.exports = { getAll, getById, generate, getStatus, streamStatus, remove, lock, publish, explainScheduleConflict };
