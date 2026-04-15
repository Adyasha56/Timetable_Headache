const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    dept_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    type: { type: String, enum: ['theory', 'lab', 'tutorial'], required: true },
    credits: { type: Number, required: true },
    sessions_per_week: { type: Number, required: true },
    session_duration_slots: { type: Number, default: 1 },
    batch_count: { type: Number, default: 1 },
    requires_lab_assistant: { type: Boolean, default: false },
    room_type_required: {
      type: String,
      enum: ['classroom', 'lab', 'seminar_hall', 'auditorium'],
    },
    enrollment: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

subjectSchema.index({ dept_id: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
