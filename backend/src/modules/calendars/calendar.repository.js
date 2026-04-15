const AcademicCalendar = require('./calendar.model');

const findAll = () => AcademicCalendar.find().sort({ year: -1, semester: -1 });
const findById = (id) => AcademicCalendar.findById(id);
const findBySemester = (year, semester) => AcademicCalendar.findOne({ year, semester });
const create = (data) => AcademicCalendar.create(data);
const update = (id, data) => AcademicCalendar.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => AcademicCalendar.findByIdAndDelete(id);

module.exports = { findAll, findById, findBySemester, create, update, remove };
