const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  faculty_count: { type: Number, default: 0 },
  room_group: { type: String },
  active: { type: Boolean, default: true },
});

module.exports = mongoose.model('Department', departmentSchema);
