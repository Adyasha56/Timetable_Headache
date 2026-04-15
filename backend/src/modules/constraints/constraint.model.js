const mongoose = require('mongoose');

const constraintSchema = new mongoose.Schema(
  {
    semester_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicCalendar',
      required: true,
    },
    dept_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    raw_text: { type: String },
    parsed_json: { type: mongoose.Schema.Types.Mixed },
    type: { type: String, enum: ['hard', 'soft'], required: true },
    weight: { type: Number, default: 1 },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'active' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

constraintSchema.index({ semester_id: 1, dept_id: 1 });

module.exports = mongoose.model('Constraint', constraintSchema);
