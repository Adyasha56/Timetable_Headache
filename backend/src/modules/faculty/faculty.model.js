const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({ day: Number, slot: Number }, { _id: false });

const facultySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    dept_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    type: { type: String, enum: ['faculty', 'lab_assistant', 'visiting'], default: 'faculty' },
    expertise: [{ type: String }],
    max_hours_per_week: { type: Number, default: 20 },
    availability: [[Boolean]],
    preferences: {
      preferred_slots: [slotSchema],
      avoid_slots: [slotSchema],
    },
    joined_date: { type: Date },
    status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' },
    is_probation: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

facultySchema.index({ dept_id: 1 });
facultySchema.index({ expertise: 1 });

module.exports = mongoose.model('Faculty', facultySchema);
