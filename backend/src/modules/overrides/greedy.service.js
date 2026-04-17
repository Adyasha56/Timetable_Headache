const Faculty = require('../faculty/faculty.model');
const DailyOverride = require('./daily-override.model');
const Schedule = require('../timetables/schedule.model');

/**
 * Given an absent teacher, find available substitutes for the given slot.
 * Strategy:
 *  1. Find faculty from same dept with overlapping expertise
 *  2. Filter out anyone already teaching at that day/slot on the published timetable
 *  3. Filter out anyone who has another override on the same date/slot
 */
const findSubstitutes = async ({ dept_id, date, slot, subject_id }) => {
  const dayOfWeek = new Date(date).getDay(); // 0=Sun, 1=Mon … 6=Sat
  const slotIndex = slot.period;

  // All active faculty in department
  const allFaculty = await Faculty.find({ dept_id, status: 'active' });

  // Faculty busy via published timetable on this day/slot
  const publishedSchedules = await Schedule.find({ dept_id, status: 'published' });
  const busyFacultyIds = new Set();
  publishedSchedules.forEach((sched) => {
    sched.sessions.forEach((s) => {
      if (s.day === dayOfWeek && s.slot === slotIndex) {
        busyFacultyIds.add(s.faculty_id.toString());
      }
    });
  });

  // Faculty busy via existing overrides on this date/slot
  const existingOverrides = await DailyOverride.find({ date: new Date(date) });
  existingOverrides.forEach((o) => {
    if (o.slot?.period === slotIndex && o.substitute_teacher_id) {
      busyFacultyIds.add(o.substitute_teacher_id.toString());
    }
    if (o.slot?.period === slotIndex && o.original_teacher_id) {
      busyFacultyIds.add(o.original_teacher_id.toString());
    }
  });

  const available = allFaculty.filter((f) => !busyFacultyIds.has(f._id.toString()));

  return available.map((f) => ({
    faculty_id: f._id,
    name: f.name,
    expertise: f.expertise,
    type: f.type,
  }));
};

module.exports = { findSubstitutes };
