const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['timetable_published', 'timetable_generated', 'override_created', 'solver_failed'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    ref_id: { type: mongoose.Schema.Types.ObjectId },
    ref_type: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

notificationSchema.index({ user_id: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
