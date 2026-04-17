const AcademicCalendar = require('./calendar.model');
const Subject = require('../subjects/subject.model');
const Faculty = require('../faculty/faculty.model');
const Constraint = require('../constraints/constraint.model');
const AppError = require('../../common/errors/AppError');

/**
 * Year rollover: copy all subjects, faculty, and optionally constraints
 * from one semester to a new one.
 *
 * What it does:
 *  - Creates a new AcademicCalendar document for the target year/semester
 *  - Subjects and Faculty are shared (not duplicated) — they are not semester-specific
 *  - Constraints are semester-specific → optionally copied over as drafts
 */
const rollover = async ({ from_semester_id, to_year, to_semester, start_date, end_date, copy_constraints = false }) => {
  const source = await AcademicCalendar.findById(from_semester_id);
  if (!source) throw new AppError('Source semester not found', 404, 'NOT_FOUND');

  const existing = await AcademicCalendar.findOne({ year: to_year, semester: to_semester });
  if (existing) throw new AppError(`Calendar for ${to_year} semester ${to_semester} already exists`, 409, 'DUPLICATE');

  // Create new calendar
  const newCalendar = await AcademicCalendar.create({
    year: to_year,
    semester: to_semester,
    start_date: new Date(start_date),
    end_date: new Date(end_date),
    holidays: [],
    half_days: [],
    events: [],
  });

  let copiedConstraints = [];

  if (copy_constraints) {
    const existing_constraints = await Constraint.find({
      semester_id: from_semester_id,
      status: 'active',
    });

    if (existing_constraints.length) {
      const newConstraints = existing_constraints.map((c) => ({
        semester_id: newCalendar._id,
        dept_id: c.dept_id,
        raw_text: c.raw_text,
        parsed_json: c.parsed_json,
        type: c.type,
        weight: c.weight,
        created_by: c.created_by,
        status: 'pending', // needs review before going active
      }));
      copiedConstraints = await Constraint.insertMany(newConstraints);
    }
  }

  // Summary counts (faculty/subjects not duplicated, just reported)
  const [facultyCount, subjectCount] = await Promise.all([
    Faculty.countDocuments({ status: 'active' }),
    Subject.countDocuments({ active: true }),
  ]);

  return {
    new_calendar: newCalendar,
    summary: {
      active_faculty: facultyCount,
      active_subjects: subjectCount,
      constraints_copied: copiedConstraints.length,
      note: copy_constraints
        ? 'Copied constraints are in "pending" status — review before activating'
        : 'No constraints copied — add them fresh for the new semester',
    },
  };
};

module.exports = { rollover };
