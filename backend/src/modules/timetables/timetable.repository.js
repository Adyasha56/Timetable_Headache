const Schedule = require('./schedule.model');
const SolverJob = require('./solver-job.model');

const findSchedules = async (filter = {}, page = 1, limit = 20) => {
  const [data, total] = await Promise.all([
    Schedule.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('semester_id', 'year semester')
      .populate('dept_id', 'name code'),
    Schedule.countDocuments(filter),
  ]);
  return [data, total];
};

const findScheduleById = (id) =>
  Schedule.findById(id)
    .populate('semester_id', 'year semester')
    .populate('dept_id', 'name code')
    .populate('sessions.faculty_id', 'name')
    .populate('sessions.subject_id', 'name code')
    .populate('sessions.room_id', 'name type');

const createSchedule = (data) => Schedule.create(data);

const updateSchedule = (id, data) => Schedule.findByIdAndUpdate(id, data, { new: true });

const createSolverJob = (data) => SolverJob.create(data);

const findJobsBySchedule = (scheduleId) => SolverJob.find({ schedule_id: scheduleId });

const findJobById = (id) => SolverJob.findById(id);

const updateJob = (id, data) => SolverJob.findByIdAndUpdate(id, data, { new: true });

module.exports = {
  findSchedules,
  findScheduleById,
  createSchedule,
  updateSchedule,
  createSolverJob,
  findJobsBySchedule,
  findJobById,
  updateJob,
};
