const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    user_email: { type: String },
    method: { type: String },
    path: { type: String },
    body: { type: mongoose.Schema.Types.Mixed },
    status_code: { type: Number },
    ip: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

auditSchema.index({ user_id: 1 });
auditSchema.index({ created_at: -1 });

module.exports = mongoose.model('Audit', auditSchema);
