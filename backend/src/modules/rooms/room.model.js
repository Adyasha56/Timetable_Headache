const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['classroom', 'lab', 'seminar_hall', 'auditorium'],
    required: true,
  },
  capacity: { type: Number, required: true },
  dept_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  amenities: [{ type: String }],
  blocked_slots: [{ day: Number, slot: Number }],
  active: { type: Boolean, default: true },
});

roomSchema.index({ dept_id: 1 });
roomSchema.index({ type: 1 });

module.exports = mongoose.model('Room', roomSchema);
