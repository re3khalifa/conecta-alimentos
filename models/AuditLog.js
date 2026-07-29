const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: [
      'auth.login.success',
      'auth.login.failed',
      'auth.register',
      'auth.logout',
      'offer.create',
      'offer.update',
      'offer.delete',
      'reservation.create',
    ],
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email: { type: String, default: null }, // útil también cuando el login falla y no hay user._id
  ip: { type: String, default: null },
  detail: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
