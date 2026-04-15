const mongoose = require('mongoose');

const solverJobSchema = new mongoose.Schema(
  {
    schedule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
    dept_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'done', 'failed'],
      default: 'pending',
    },
    queue_name: { type: String },
    result: { type: mongoose.Schema.Types.Mixed },
    error: { type: String },
    duration_ms: { type: Number },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

solverJobSchema.index({ schedule_id: 1, dept_id: 1, status: 1 });

module.exports = mongoose.model('SolverJob', solverJobSchema);
