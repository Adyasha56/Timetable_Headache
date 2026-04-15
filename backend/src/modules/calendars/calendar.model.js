const mongoose = require('mongoose');

const academicCalendarSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    semester: { type: Number, required: true, enum: [1, 2] },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    holidays: [{ type: Date }],
    half_days: [{ type: Date }],
    events: [
      {
        date: Date,
        slots_blocked: [{ day: Number, slot: Number }],
        name: String,
      },
    ],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('AcademicCalendar', academicCalendarSchema);
