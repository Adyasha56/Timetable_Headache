const mongoose = require('mongoose');

const dailyOverrideSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ['holiday', 'half_day', 'teacher_absent', 'room_blocked', 'extra_class'],
      required: true,
    },
    original_teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    substitute_teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    slot: { day: Number, period: Number },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    reason: { type: String },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notified_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

dailyOverrideSchema.index({ date: 1 });

module.exports = mongoose.model('DailyOverride', dailyOverrideSchema);
